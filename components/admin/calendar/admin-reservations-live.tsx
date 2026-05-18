"use client";

import { useCallback, useEffect, useState } from "react";

import { AdminCalendarView } from "@/components/admin/calendar/admin-calendar-view";
import {
  AdminPendingRequestsSection,
  AdminRecentDecisionsSection,
} from "@/components/admin/views/admin-bookings-view";
import { AdminPhantomRequestsSection } from "@/components/admin/views/admin-phantom-requests-section";
import type { AdminBookingRow, AdminCalendarBooking } from "@/components/admin/admin-types";
import { useAdminRealtimeRefetch } from "@/hooks/use-admin-realtime-refetch";
import { fetchAdminBookings, fetchAdminCalendarBookings } from "@/lib/admin/data";
import {
  fetchAdminPhantomRequests,
  type AdminPhantomRequest,
} from "@/lib/phantom/requests";
import { ADMIN_REQUESTS_SYNC } from "@/lib/realtime/admin-sync";
import { createClient } from "@/lib/supabase/client";

type AdminReservationsLiveProps = {
  initialList: {
    pending: AdminBookingRow[];
    recent: AdminBookingRow[];
  };
  initialCalendar: AdminCalendarBooking[];
  initialPhantomRequests: AdminPhantomRequest[];
  rangeStartIso: string;
  rangeEndIso: string;
};

export function AdminReservationsLive({
  initialList,
  initialCalendar,
  initialPhantomRequests,
  rangeStartIso,
  rangeEndIso,
}: AdminReservationsLiveProps) {
  const [list, setList] = useState(initialList);
  const [calendar, setCalendar] = useState(initialCalendar);
  const [phantomRequests, setPhantomRequests] = useState(initialPhantomRequests);

  useEffect(() => {
    setList(initialList);
    setCalendar(initialCalendar);
    setPhantomRequests(initialPhantomRequests);
  }, [initialList, initialCalendar, initialPhantomRequests]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const [nextList, nextCal, nextPhantom] = await Promise.all([
      fetchAdminBookings(supabase),
      fetchAdminCalendarBookings(supabase, rangeStartIso, rangeEndIso),
      fetchAdminPhantomRequests(supabase),
    ]);
    setList(nextList);
    setCalendar(nextCal);
    setPhantomRequests(nextPhantom);
  }, [rangeStartIso, rangeEndIso]);

  useAdminRealtimeRefetch(
    refetch,
    ADMIN_REQUESTS_SYNC,
    400,
    "admin:reservations",
  );

  return (
    <div className="flex flex-col gap-10 pb-4">
      <AdminPendingRequestsSection pending={list.pending} />

      <AdminPhantomRequestsSection requests={phantomRequests} />

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

