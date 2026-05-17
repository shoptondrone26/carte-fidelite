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

export function bookingsChannelName(userId: string): string {
  return `bookings:${userId}`;
}

export function pendingFromBookingRow(
  row: BookingRealtimeRow,
): ClientPendingBooking | null {
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

export function isActiveClientBooking(
  booking: ClientPendingBooking | null,
): booking is ClientPendingBooking {
  return booking?.status === "pending" || booking?.status === "accepted";
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
