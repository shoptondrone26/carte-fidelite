import type { Metadata } from "next";

import { BoutiqueView } from "@/components/client/boutique/boutique-view";
import { fetchBoutiqueSnapshot } from "@/lib/boutique/snapshot";
import { requireClient } from "@/lib/client/require-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boutique",
  description: "Boutique membre ShopTonDrone Privé",
};

export default async function BoutiquePage() {
  const { supabase, user } = await requireClient("/boutique");
  const snapshot = await fetchBoutiqueSnapshot(supabase, user.id);

  return <BoutiqueView snapshot={snapshot} />;
}
