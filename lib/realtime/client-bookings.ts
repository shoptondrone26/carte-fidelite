export type ClientPendingBooking = {
  id: string;
  created_at: string;
  starts_at: string;
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
  if (row.status !== "pending") return null;
  return {
    id: row.id,
    created_at: row.created_at,
    starts_at: row.starts_at,
  };
}
