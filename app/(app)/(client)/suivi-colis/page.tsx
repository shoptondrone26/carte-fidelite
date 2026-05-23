import type { Metadata } from "next";

import { ParcelTrackingLive } from "@/components/client/tracking/parcel-tracking-live";
import { fetchClientTrackableShopOrders } from "@/lib/boutique/orders";
import { requireClient } from "@/lib/client/require-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suivi colis",
  description: "Suivi Chronopost de vos commandes ShopTonDrone Privé",
};

export default async function SuiviColisPage() {
  const { supabase, user } = await requireClient("/suivi-colis");
  const orders = await fetchClientTrackableShopOrders(supabase, user.id);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 overflow-x-hidden px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
      <ParcelTrackingLive userId={user.id} initialOrders={orders} />
    </main>
  );
}
