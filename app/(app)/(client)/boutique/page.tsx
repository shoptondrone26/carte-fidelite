import type { Metadata } from "next";

import { BoutiqueLive } from "@/components/client/boutique/boutique-live";
import { fetchClientActiveShopOrders } from "@/lib/boutique/orders";
import { fetchCatalogProducts } from "@/lib/boutique/products";
import { requireClient } from "@/lib/client/require-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boutique",
  description: "Catalogue boutique membre ShopTonDrone Privé",
};

export default async function BoutiquePage() {
  const { supabase, user } = await requireClient("/boutique");
  const [products, orders] = await Promise.all([
    fetchCatalogProducts(supabase),
    fetchClientActiveShopOrders(supabase, user.id),
  ]);

  return (
    <BoutiqueLive
      products={products}
      initialOrders={orders}
      userId={user.id}
    />
  );
}
