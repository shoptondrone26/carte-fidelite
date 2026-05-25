import type { Metadata } from "next";

import { AdminTrackingLive } from "@/components/admin/tracking/admin-tracking-live";
import { fetchAdminTrackableShopOrders } from "@/lib/boutique/orders";
import { requireAdmin } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suivi colis admin",
};

export default async function AdminSuiviColisPage() {
  const { supabase } = await requireAdmin("/admin/suivi-colis");
  const { active, history } = await fetchAdminTrackableShopOrders(supabase);

  return (
    <AdminTrackingLive initialActive={active} initialHistory={history} />
  );
}
