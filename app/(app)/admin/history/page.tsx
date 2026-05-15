import type { Metadata } from "next";

import { AdminHistoryLive } from "@/components/admin/views/admin-history-live";
import { fetchAdminGlobalHistory } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Historique",
};

export default async function AdminHistoryPage() {
  const { supabase } = await requireAdmin("/admin/history");
  const entries = await fetchAdminGlobalHistory(supabase);

  return <AdminHistoryLive initial={entries} />;
}
