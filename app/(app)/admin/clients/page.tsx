import type { Metadata } from "next";

import { AdminClientsLive } from "@/components/admin/views/admin-clients-live";
import { fetchAdminClients } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Carnet clients",
};

export default async function AdminClientsPage() {
  const { supabase } = await requireAdmin("/admin/clients");
  const { addressBook, historyByClient } = await fetchAdminClients(supabase);

  return (
    <AdminClientsLive initial={{ addressBook, historyByClient }} />
  );
}
