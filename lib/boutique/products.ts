import type { SupabaseClient } from "@supabase/supabase-js";

import { shopCategoryLabel } from "@/lib/boutique/categories";
import { refreshShopOrders } from "@/lib/boutique/orders";
import type { ProductsByCategory, ShopProduct } from "@/lib/boutique/types";

const SELECT_COLUMNS =
  "id, name, description, price_eur, stock, image_url, category, is_active, sort_order, created_at, updated_at";

type ShopProductRow = {
  id: string;
  name: string;
  description: string | null;
  price_eur: number | string;
  stock: number;
  image_url: string | null;
  category: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function mapShopProduct(row: ShopProductRow): ShopProduct {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price_eur: Number(row.price_eur),
    stock: row.stock,
    image_url: row.image_url,
    category: row.category,
    is_active: row.is_active,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function fetchCatalogProducts(
  supabase: SupabaseClient,
): Promise<ShopProduct[]> {
  await refreshShopOrders(supabase);
  const { data, error } = await supabase
    .from("shop_products")
    .select(SELECT_COLUMNS)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data as ShopProductRow[] | null) ?? []).map(mapShopProduct);
}

export async function fetchAdminShopProducts(
  supabase: SupabaseClient,
): Promise<ShopProduct[]> {
  const { data, error } = await supabase
    .from("shop_products")
    .select(SELECT_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return ((data as ShopProductRow[] | null) ?? []).map(mapShopProduct);
}

export function groupProductsByCategory(
  products: ShopProduct[],
): ProductsByCategory[] {
  const map = new Map<string, ShopProduct[]>();
  for (const product of products) {
    const list = map.get(product.category) ?? [];
    list.push(product);
    map.set(product.category, list);
  }

  return [...map.entries()]
    .map(([category, items]) => ({
      category,
      label: shopCategoryLabel(category),
      products: items,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

export function formatShopPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
