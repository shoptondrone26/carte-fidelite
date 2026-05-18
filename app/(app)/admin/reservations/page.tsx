import type { Metadata } from "next";

import {
  AdminReservationsLive,
} from "@/components/admin/calendar/admin-reservations-live";
import {
  adminReservationsFetchRange,
} from "@/lib/admin/calendar-utils";
import {
  fetchAdminBookings,
  fetchAdminCalendarBookings,
} from "@/lib/admin/data";
import { fetchAdminPhantomRequests } from "@/lib/phantom/requests";
import { requireAdmin } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Réservations",
};

export default async function AdminReservationsPage() {
  const { supabase } = await requireAdmin("/admin/reservations");
  const { rangeStartIso, rangeEndIso } = adminReservationsFetchRange();
  const [{ pending, recent }, calendar, phantomRequests] = await Promise.all([
    fetchAdminBookings(supabase),
    fetchAdminCalendarBookings(supabase, rangeStartIso, rangeEndIso),
    fetchAdminPhantomRequests(supabase),
  ]);

  return (
    <AdminReservationsLive
      initialList={{ pending, recent }}
      initialCalendar={calendar}
      initialPhantomRequests={phantomRequests}
      rangeStartIso={rangeStartIso}
      rangeEndIso={rangeEndIso}
    />
  );
}
