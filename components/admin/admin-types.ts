export type AdminBookingRow = {
  id: string;
  status: string;
  validated: boolean | null;
  created_at: string;
  starts_at: string;
  ends_at: string;
  profile_id: string;
  profiles: {
    full_name: string | null;
    email: string | null;
    snap: string | null;
  } | null;
};

export type AdminCalendarBooking = AdminBookingRow & {
  notes: string | null;
};

export type AdminClientRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  snap: string | null;
  total_unlocks: number | null;
  points_balance?: number | null;
  referral_code?: string | null;
  referred_by?: string | null;
  created_at: string;
};

export type AdminStats = {
  pendingCount: number;
  acceptedToday: number;
  refusedToday: number;
  totalClients: number;
};
