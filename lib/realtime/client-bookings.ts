import type { SupabaseClient } from "@supabase/supabase-js";

export type ClientBookingStatus = "pending" | "accepted" | "refused" | "cancelled";

export type ClientPendingBooking = {
  id: string;
  created_at: string;
  starts_at: string;
  status: ClientBookingStatus;
};

export type BookingRealtimeRow = {
  id: string;
  profile_id: string;
  status: string;
  created_at: string;
  starts_at: string;
};

type ClientBookingRow = {
  id: string;
  status: string;
  created_at: string;
  starts_at: string;
};

export function bookingsChannelName(userId: string): string {
  return `bookings:${userId}`;
}

export function pendingFromBookingRow(
  row: BookingRealtimeRow,
): ClientPendingBooking | null {
  return clientBookingFromRow(row);
}

function clientBookingFromRow(row: ClientBookingRow): ClientPendingBooking | null {
  if (
    row.status !== "pending" &&
    row.status !== "accepted" &&
    row.status !== "refused" &&
    row.status !== "cancelled"
  ) {
    return null;
  }
  return {
    id: row.id,
    created_at: row.created_at,
    starts_at: row.starts_at,
    status: row.status,
  };
}

export async function fetchClientBookingSnapshot(
  supabase: SupabaseClient,
  userId: string,
): Promise<ClientPendingBooking | null> {
  const select = "id, created_at, starts_at, status";
  const nowIso = new Date().toISOString();

  const { data: pendingRow } = await supabase
    .from("bookings")
    .select(select)
    .eq("profile_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pendingRow) {
    return clientBookingFromRow(pendingRow as ClientBookingRow);
  }

  const { data: acceptedRow } = await supabase
    .from("bookings")
    .select(select)
    .eq("profile_id", userId)
    .eq("status", "accepted")
    .gt("starts_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (acceptedRow) {
    return clientBookingFromRow(acceptedRow as ClientBookingRow);
  }

  const { data: latestRow } = await supabase
    .from("bookings")
    .select(select)
    .eq("profile_id", userId)
    .in("status", ["accepted", "refused", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return latestRow ? clientBookingFromRow(latestRow as ClientBookingRow) : null;
}

export function isActiveClientBooking(
  booking: ClientPendingBooking | null,
  nowMs = Date.now(),
): booking is ClientPendingBooking {
  if (!booking) return false;
  if (booking.status !== "pending" && booking.status !== "accepted") {
    return false;
  }
  return new Date(booking.starts_at).getTime() > nowMs;
}

export function canClientCancelBooking(
  booking: ClientPendingBooking,
  nowMs = Date.now(),
): boolean {
  if (booking.status === "pending") return true;
  if (booking.status !== "accepted") return false;
  return new Date(booking.starts_at).getTime() - nowMs > 20 * 60 * 1000;
}

export function clientBookingStatusLabelFr(status: ClientBookingStatus): string {
  switch (status) {
    case "pending":
      return "En attente";
    case "accepted":
      return "Acceptée";
    case "refused":
      return "Refusée";
    case "cancelled":
      return "Annulée";
  }
}
