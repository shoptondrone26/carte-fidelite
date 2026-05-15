"use client";

import { useCallback, useEffect, useState } from "react";

import { AdminCalendarView } from "@/components/admin/calendar/admin-calendar-view";
import {
  AdminPendingRequestsSection,
  AdminRecentDecisionsSection,
} from "@/components/admin/views/admin-bookings-view";
import type { AdminBookingRow, AdminCalendarBooking } from "@/components/admin/admin-types";
import { useAdminRealtimeRefetch } from "@/hooks/use-admin-realtime-refetch";
import { fetchAdminBookings, fetchAdminCalendarBookings } from "@/lib/admin/data";
import { ADMIN_BOOKINGS_SYNC } from "@/lib/realtime/admin-sync";
import { createClient } from "@/lib/supabase/client";

type AdminReservationsLiveProps = {
  initialList: {
    pending: AdminBookingRow[];
    recent: AdminBookingRow[];
  };
  initialCalendar: AdminCalendarBooking[];
  rangeStartIso: string;
  rangeEndIso: string;
};

export function AdminReservationsLive({
  initialList,
  initialCalendar,
  rangeStartIso,
  rangeEndIso,
}: AdminReservationsLiveProps) {
  const [list, setList] = useState(initialList);
  const [calendar, setCalendar] = useState(initialCalendar);

  useEffect(() => {
    setList(initialList);
    setCalendar(initialCalendar);
  }, [initialList, initialCalendar]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const [nextList, nextCal] = await Promise.all([
      fetchAdminBookings(supabase),
      fetchAdminCalendarBookings(supabase, rangeStartIso, rangeEndIso),
    ]);
    setList(nextList);
    setCalendar(nextCal);
  }, [rangeStartIso, rangeEndIso]);

  useAdminRealtimeRefetch(
    refetch,
    ADMIN_BOOKINGS_SYNC,
    400,
    "admin:reservations",
  );

  return (
    <div className="flex flex-col gap-10 pb-4">
      <AdminPendingRequestsSection pending={list.pending} />

      <section className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">Calendrier</h2>
        <AdminCalendarView
          bookings={calendar}
          onAction={() => void refetch()}
        />
      </section>

      <AdminRecentDecisionsSection recent={list.recent} />
    </div>
  );
}

