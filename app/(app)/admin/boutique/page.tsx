import type { Metadata } from "next";

import { AdminBoutiqueLive } from "@/components/admin/shop/admin-boutique-live";
import { fetchAdminShopOrders } from "@/lib/boutique/orders";
import { fetchAdminShopProducts } from "@/lib/boutique/products";
import { requireAdmin } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boutique admin",
};

export default async function AdminBoutiquePage() {
  const { supabase } = await requireAdmin("/admin/boutique");
  const [products, orders] = await Promise.all([
    fetchAdminShopProducts(supabase),
    fetchAdminShopOrders(supabase),
  ]);

  return (
    <AdminBoutiqueLive initialProducts={products} initialOrders={orders} />
  );
}
