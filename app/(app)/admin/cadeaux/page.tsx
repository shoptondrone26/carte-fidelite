import type { Metadata } from "next";

import { AdminGiftsLive } from "@/components/admin/views/admin-gifts-live";
import { fetchAdminGifts } from "@/lib/admin/gifts";
import { requireAdmin } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cadeaux à traiter",
};

export default async function AdminGiftsPage() {
  const { supabase } = await requireAdmin("/admin/cadeaux");
  const snapshot = await fetchAdminGifts(supabase);

  return <AdminGiftsLive initial={snapshot} />;
}

