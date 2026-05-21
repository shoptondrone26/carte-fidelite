import type {
  AdminBookingRow,
  AdminCalendarBooking,
  AdminClientRow,
} from "@/components/admin/admin-types";
import type { AdminClientCardData } from "@/components/admin/admin-client-card";
import type { AdminHistorySnippet } from "@/components/admin/admin-client-card";
import type { AdminStats } from "@/components/admin/admin-types";
import { fetchSpendByClient } from "@/lib/admin/accounting";
import {
  buildLatestShopOrderByClient,
  isAdminCancellableLatestShopOrder,
  type ClientLatestShopOrderSnippet,
} from "@/lib/boutique/orders";
import type { PhantomRequestStatus } from "@/lib/phantom/requests";
import type { SupabaseClient } from "@supabase/supabase-js";

type BookingQueryRow = {
  id: string;
  status: string;
  validated: boolean | null;
  created_at: string;
  starts_at: string;
  ends_at: string;
  notes?: string | null;
  profile_id: string;
  profiles:
    | {
        full_name: string | null;
        email: string | null;
        snap?: string | null;
      }
    | {
        full_name: string | null;
        email: string | null;
        snap?: string | null;
      }[]
    | null;
};

type HistoryRow = {
  id: string;
  subject_id: string;
  event_type: string;
  created_at: string;
};

type ClientPhantomRequestRow = {
  id: string;
  profile_id: string;
  status: PhantomRequestStatus;
  amount_eur: number;
  created_at: string;
};

const CANCELLABLE_PHANTOM_STATUSES: PhantomRequestStatus[] = [
  "accepted",
  "payment_pending",
  "paid",
  "in_progress",
  "completed",
];

export type AdminHistoryEntry = {
  id: string;
  subject_id: string;
  event_type: string;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
};

export function mapBooking(row: BookingQueryRow): AdminBookingRow {
  const p = row.profiles;
  const profiles = Array.isArray(p) ? p[0] ?? null : p;
  return {
    id: row.id,
    status: row.status,
    validated: row.validated,
    created_at: row.created_at,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    profile_id: row.profile_id,
    profiles: profiles
      ? {
          full_name: profiles.full_name,
          email: profiles.email,
          snap: profiles.snap ?? null,
        }
      : null,
  };
}

export function mapCalendarBooking(row: BookingQueryRow): AdminCalendarBooking {
  const base = mapBooking(row);
  return { ...base, notes: row.notes ?? null };
}

export function buildFreeUsedCounts(
  rows: { subject_id: string }[] | null,
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of rows ?? []) {
    map[row.subject_id] = (map[row.subject_id] ?? 0) + 1;
  }
  return map;
}

export function buildHistoryByClient(
  rows: HistoryRow[] | null,
  limitPerClient = 4,
): Record<string, AdminHistorySnippet[]> {
  const map: Record<string, AdminHistorySnippet[]> = {};
  for (const row of rows ?? []) {
    const list = map[row.subject_id] ?? [];
    if (list.length >= limitPerClient) continue;
    list.push({
      id: row.id,
      event_type: row.event_type,
      created_at: row.created_at,
    });
    map[row.subject_id] = list;
  }
  return map;
}

export async function fetchAdminStats(
  supabase: SupabaseClient,
  pendingCount: number,
): Promise<AdminStats> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startIso = start.toISOString();

  const { count: totalClients } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  const { count: acceptedToday } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "accepted")
    .gte("updated_at", startIso);

  const { count: refusedToday } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "refused")
    .gte("updated_at", startIso);

  return {
    pendingCount,
    acceptedToday: acceptedToday ?? 0,
    refusedToday: refusedToday ?? 0,
    totalClients: totalClients ?? 0,
  };
}

export async function fetchAdminBookings(supabase: SupabaseClient) {
  const bookingSelect =
    "id, status, validated, created_at, starts_at, ends_at, profile_id, profiles (full_name, email, snap)";

  const { data: pendingRaw } = await supabase
    .from("bookings")
    .select(bookingSelect)
    .eq("status", "pending")
    .order("starts_at", { ascending: true });

  const { data: upcomingAcceptedRaw } = await supabase
    .from("bookings")
    .select(bookingSelect)
    .eq("status", "accepted")
    .order("starts_at", { ascending: true });

  const upcomingAccepted =
    (upcomingAcceptedRaw as BookingQueryRow[] | null) ?? [];
  const acceptedProfileIds = [
    ...new Set(upcomingAccepted.map((booking) => booking.profile_id)),
  ];
  const { data: validatedUnlocksRaw } =
    acceptedProfileIds.length > 0
      ? await supabase
          .from("history")
          .select("subject_id, created_at")
          .eq("event_type", "unlock_validated")
          .in("subject_id", acceptedProfileIds)
          .order("created_at", { ascending: false })
      : { data: [] };

  const validatedUnlocksByClient = new Map<string, number[]>();
  for (const row of
    (validatedUnlocksRaw as Pick<HistoryRow, "subject_id" | "created_at">[] | null) ??
    []) {
    const timestamps = validatedUnlocksByClient.get(row.subject_id) ?? [];
    timestamps.push(new Date(row.created_at).getTime());
    validatedUnlocksByClient.set(row.subject_id, timestamps);
  }

  const acceptedStillToProcess = upcomingAccepted.filter((booking) => {
    const unlocks = validatedUnlocksByClient.get(booking.profile_id) ?? [];
    const bookingCreatedAt = new Date(booking.created_at).getTime();
    return !unlocks.some((validatedAt) => validatedAt >= bookingCreatedAt);
  });

  const { data: recentRaw } = await supabase
    .from("bookings")
    .select(bookingSelect)
    .in("status", ["accepted", "refused", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(24);

  const pending = [
    ...((pendingRaw as BookingQueryRow[] | null)?.map(mapBooking) ?? []),
    ...acceptedStillToProcess.map(mapBooking),
  ].sort(
    (a, b) =>
      new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );
  const recent = (recentRaw as BookingQueryRow[] | null)?.map(mapBooking) ?? [];

  return { pending, recent };
}

export async function fetchAdminCalendarBookings(
  supabase: SupabaseClient,
  rangeStartIso: string,
  rangeEndIso: string,
) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, status, validated, created_at, starts_at, ends_at, notes, profile_id, profiles (full_name, email, snap)",
    )
    .gte("starts_at", rangeStartIso)
    .lt("starts_at", rangeEndIso)
    .in("status", ["pending", "accepted", "refused", "cancelled"])
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("fetchAdminCalendarBookings", error.message);
    return [];
  }

  return (
    (data as BookingQueryRow[] | null)?.map(mapCalendarBooking) ?? []
  );
}

export async function fetchAdminClients(supabase: SupabaseClient) {
  const { data: addressBookRaw } = await supabase
    .from("profiles")
    .select("id, full_name, email, snap, total_unlocks, created_at")
    .order("full_name", { ascending: true });

  const { data: historyRaw } = await supabase
    .from("history")
    .select("id, subject_id, event_type, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: freeUsedRaw } = await supabase
    .from("history")
    .select("subject_id")
    .eq("event_type", "free_used");

  const { data: phantomRaw, error: phantomError } = await supabase
    .from("phantom_requests")
    .select("id, profile_id, status, amount_eur, created_at")
    .in("status", CANCELLABLE_PHANTOM_STATUSES)
    .order("created_at", { ascending: false });

  if (phantomError) {
    console.error("fetchAdminClientPhantomRequests", phantomError.message);
  }

  const { data: shopOrdersRaw, error: shopOrdersError } = await supabase
    .from("shop_orders")
    .select(
      "id, profile_id, status, product_name, total_price_eur, created_at, stock_reserved",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (shopOrdersError) {
    console.error("fetchAdminClientShopOrders", shopOrdersError.message);
  }

  const shopOrderRows =
    (shopOrdersRaw as (ClientLatestShopOrderSnippet & {
      profile_id: string;
    })[]) ?? [];

  const latestShopByClient = buildLatestShopOrderByClient(
    shopOrderRows.map((row) => ({
      ...row,
      total_price_eur: Number(row.total_price_eur),
    })),
  );

  const freeUsedCounts = buildFreeUsedCounts(freeUsedRaw);
  const spendByClient = await fetchSpendByClient(supabase);
  const phantomByClient = new Map<string, ClientPhantomRequestRow>();
  for (const request of (phantomRaw as ClientPhantomRequestRow[] | null) ?? []) {
    if (!phantomByClient.has(request.profile_id)) {
      phantomByClient.set(request.profile_id, request);
    }
  }

  const addressBook: AdminClientCardData[] = (
    (addressBookRaw as AdminClientRow[] | null) ?? []
  ).map((c) => {
    const spend = spendByClient[c.id];
    const freeUsed = freeUsedCounts[c.id] ?? 0;
    return {
      id: c.id,
      full_name: c.full_name,
      email: c.email,
      snap: c.snap,
      total_unlocks: c.total_unlocks,
      free_used_count: freeUsed,
      total_spent_eur: spend?.totalSpentEur ?? 0,
      paid_unlocks_count: spend?.paidUnlocksCount ?? 0,
      phantom_request: phantomByClient.get(c.id) ?? null,
      latest_shop_order: (() => {
        const latest = latestShopByClient.get(c.id) ?? null;
        return isAdminCancellableLatestShopOrder(latest) ? latest : null;
      })(),
    };
  });
  const historyByClient = buildHistoryByClient(
    historyRaw as HistoryRow[] | null,
  );

  return { addressBook, historyByClient };
}

export async function fetchAdminTopClients(supabase: SupabaseClient) {
  const { data: topRaw } = await supabase
    .from("profiles")
    .select("id, full_name, email, snap, total_unlocks, created_at")
    .order("total_unlocks", { ascending: false })
    .limit(10);

  return (topRaw as AdminClientRow[] | null) ?? [];
}

export async function fetchAdminGlobalHistory(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("history")
    .select(
      "id, subject_id, event_type, created_at, profiles:profiles!history_subject_id_fkey (full_name, email)",
    )
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    console.error("fetchAdminGlobalHistory", error.message);
    return [];
  }

  type Raw = AdminHistoryEntry & {
    profiles:
      | { full_name: string | null; email: string | null }
      | { full_name: string | null; email: string | null }[]
      | null;
  };

  return ((data ?? []) as Raw[]).map((row) => {
    const p = row.profiles;
    const profiles = Array.isArray(p) ? p[0] ?? null : p;
    return { ...row, profiles };
  });
}
