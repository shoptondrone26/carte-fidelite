"use client";

import { useCallback, useEffect, useState } from "react";

import type { AdminBookingRow } from "@/components/admin/admin-types";
import { AdminBookingsView } from "@/components/admin/views/admin-bookings-view";
import { useAdminRealtimeRefetch } from "@/hooks/use-admin-realtime-refetch";
import { fetchAdminBookings } from "@/lib/admin/data";
import { ADMIN_BOOKINGS_SYNC } from "@/lib/realtime/admin-sync";
import { createClient } from "@/lib/supabase/client";

type AdminBookingsLiveProps = {
  initial: {
    pending: AdminBookingRow[];
    recent: AdminBookingRow[];
  };
};

export function AdminBookingsLive({ initial }: AdminBookingsLiveProps) {
  const [data, setData] = useState(initial);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const next = await fetchAdminBookings(supabase);
    setData(next);
  }, []);

  useAdminRealtimeRefetch(refetch, ADMIN_BOOKINGS_SYNC, 400, "admin:bookings");

  return <AdminBookingsView pending={data.pending} recent={data.recent} />;
}
