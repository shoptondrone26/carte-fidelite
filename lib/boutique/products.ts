import type { SupabaseClient } from "@supabase/supabase-js";

import { shopCategoryLabel } from "@/lib/boutique/categories";
import { productPrimaryImage } from "@/lib/boutique/images";
import { refreshShopOrders } from "@/lib/boutique/orders";
import type { ProductsByCategory, ShopProduct } from "@/lib/boutique/types";

export const SHOP_CATEGORY_DISPLAY_ORDER = [
  "drones",
  "accessoires",
  "autre",
  "general",
  "pieces",
] as const;

const SELECT_COLUMNS =
  "id, name, short_description, description, specs, price_eur, stock, image_url, image_urls, primary_image_index, category, is_active, sort_order, created_at, updated_at";

export type ShopProductRow = {
  id: string;
  name: string;
  short_description: string | null;
  description: string | null;
  specs: string | null;
  price_eur: number | string;
  stock: number;
  image_url: string | null;
  image_urls: string[] | null;
  primary_image_index: number | null;
  category: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function parseImageUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((u): u is string => typeof u === "string" && u.length > 0);
}

export function mapShopProduct(row: ShopProductRow): ShopProduct {
  const image_urls = parseImageUrls(row.image_urls);
  const product: ShopProduct = {
    id: row.id,
    name: row.name,
    short_description: row.short_description,
    description: row.description,
    specs: row.specs,
    price_eur: Number(row.price_eur),
    stock: row.stock,
    image_url: row.image_url,
    image_urls,
    primary_image_index: row.primary_image_index ?? 0,
    category: row.category,
    is_active: row.is_active,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  if (!product.image_url && image_urls.length > 0) {
    product.image_url = productPrimaryImage(product);
  }
  return product;
}

export function categorySortIndex(category: string): number {
  const idx = SHOP_CATEGORY_DISPLAY_ORDER.indexOf(
    category as (typeof SHOP_CATEGORY_DISPLAY_ORDER)[number],
  );
  return idx === -1 ? 999 : idx;
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

export async function fetchCatalogProductById(
  supabase: SupabaseClient,
  productId: string,
): Promise<ShopProduct | null> {
  await refreshShopOrders(supabase);
  const { data, error } = await supabase
    .from("shop_products")
    .select(SELECT_COLUMNS)
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapShopProduct(data as ShopProductRow);
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
    .sort(
      (a, b) =>
        categorySortIndex(a.category) - categorySortIndex(b.category) ||
        a.label.localeCompare(b.label, "fr"),
    );
}

export function formatShopPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function productCardDescription(product: ShopProduct): string | null {
  return product.short_description ?? product.description;
}
