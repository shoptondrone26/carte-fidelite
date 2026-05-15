import type { Metadata } from "next";

import { AdminHomeLive } from "@/components/admin/views/admin-home-live";
import {
  fetchAdminBookings,
  fetchAdminStats,
  fetchAdminTopClients,
} from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard admin",
};

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdmin("/admin");
  const { pending } = await fetchAdminBookings(supabase);
  const stats = await fetchAdminStats(supabase, pending.length);
  const topClients = await fetchAdminTopClients(supabase);

  return <AdminHomeLive initial={{ stats, topClients }} />;
}
