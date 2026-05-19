import type { Metadata } from "next";

import { BoutiqueView } from "@/components/client/boutique/boutique-view";
import { fetchCatalogProducts } from "@/lib/boutique/products";
import { requireClient } from "@/lib/client/require-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boutique",
  description: "Catalogue boutique membre ShopTonDrone Privé",
};

export default async function BoutiquePage() {
  const { supabase } = await requireClient("/boutique");
  const products = await fetchCatalogProducts(supabase);

  return <BoutiqueView products={products} />;
}
