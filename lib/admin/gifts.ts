import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  GiftCatalogItem,
  GiftRequest,
  GiftRequestStatus,
  LeaderboardEntry,
  PointsLedgerEntry,
} from "@/lib/gifts/types";

export type AdminGiftRequest = GiftRequest & {
  client: {
    id: string;
    full_name: string | null;
    email: string | null;
    snap: string | null;
    points_balance: number;
    referral_code: string | null;
    referred_by: string | null;
  } | null;
};

export type AdminReferralLink = {
  id: string;
  full_name: string | null;
  email: string | null;
  referral_code: string | null;
  referred_by: string | null;
  filleuls_count: number;
};

export type AdminGiftsSnapshot = {
  requests: AdminGiftRequest[];
  catalog: GiftCatalogItem[];
  topPoints: LeaderboardEntry[];
  referrals: AdminReferralLink[];
  recentLedger: (PointsLedgerEntry & {
    profile: { full_name: string | null; email: string | null } | null;
  })[];
};

type GiftRequestRow = Omit<GiftRequest, "gift"> & {
  gift_catalog: GiftCatalogItem | GiftCatalogItem[] | null;
  profiles:
    | AdminGiftRequest["client"]
    | AdminGiftRequest["client"][]
    | null;
};

type LedgerRow = PointsLedgerEntry & {
  profiles:
    | { full_name: string | null; email: string | null }
    | { full_name: string | null; email: string | null }[]
    | null;
};

function mapRequest(row: GiftRequestRow): AdminGiftRequest {
  const gift = Array.isArray(row.gift_catalog)
    ? row.gift_catalog[0] ?? null
    : row.gift_catalog;
  const client = Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles;
  return { ...row, gift, client };
}

function monthStartIso(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function fetchAdminGifts(
  supabase: SupabaseClient,
): Promise<AdminGiftsSnapshot> {
  const [requestsRes, catalogRes, ledgerRes, profilesRes, monthLedgerRes] =
    await Promise.all([
      supabase
        .from("gift_requests")
        .select("*, gift_catalog(*), profiles(id, full_name, email, snap, points_balance, referral_code, referred_by)")
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("gift_catalog")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase
        .from("points_ledger")
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(60),
      supabase
        .from("profiles")
        .select("id, full_name, email, referral_code, referred_by"),
      supabase
        .from("points_ledger")
        .select("profile_id, points_delta")
        .gt("points_delta", 0)
        .gte("created_at", monthStartIso()),
    ]);

  if (requestsRes.error) throw requestsRes.error;
  if (catalogRes.error) throw catalogRes.error;
  if (ledgerRes.error) throw ledgerRes.error;
  if (profilesRes.error) throw profilesRes.error;
  if (monthLedgerRes.error) throw monthLedgerRes.error;

  const profiles = (profilesRes.data ?? []) as AdminReferralLink[];
  const filleuls = new Map<string, number>();
  for (const profile of profiles) {
    if (!profile.referred_by) continue;
    filleuls.set(profile.referred_by, (filleuls.get(profile.referred_by) ?? 0) + 1);
  }

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const pointsByClient = new Map<string, number>();
  for (const row of (monthLedgerRes.data ?? []) as {
    profile_id: string;
    points_delta: number;
  }[]) {
    pointsByClient.set(
      row.profile_id,
      (pointsByClient.get(row.profile_id) ?? 0) + row.points_delta,
    );
  }

  const topPoints = [...pointsByClient.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([profileId, points]) => {
      const profile = profileById.get(profileId);
      return {
        profile_id: profileId,
        name: profile?.full_name?.trim() || profile?.email?.split("@")[0] || "Membre",
        points,
      };
    });

  return {
    requests: ((requestsRes.data ?? []) as GiftRequestRow[]).map(mapRequest),
    catalog: (catalogRes.data ?? []) as GiftCatalogItem[],
    topPoints,
    referrals: profiles.map((profile) => ({
      ...profile,
      filleuls_count: filleuls.get(profile.id) ?? 0,
    })),
    recentLedger: ((ledgerRes.data ?? []) as LedgerRow[]).map((row) => {
      const profile = Array.isArray(row.profiles)
        ? row.profiles[0] ?? null
        : row.profiles;
      return { ...row, profile };
    }),
  };
}

export const adminGiftRequestStatuses: GiftRequestStatus[] = [
  "accepted",
  "refused",
  "sent",
  "cancelled",
];

