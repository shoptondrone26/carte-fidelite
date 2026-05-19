import type { SupabaseClient } from "@supabase/supabase-js";

import {
  mapShopProduct,
  type ShopProductRow,
} from "@/lib/boutique/products";
import type { ShopProduct } from "@/lib/boutique/types";

const PRODUCT_COLUMNS =
  "id, name, short_description, description, specs, price_eur, stock, image_url, image_urls, primary_image_index, category, is_active, sort_order, created_at, updated_at";

export async function fetchRecommendedProducts(
  supabase: SupabaseClient,
  productId: string,
): Promise<ShopProduct[]> {
  const { data: links, error: linkError } = await supabase
    .from("shop_product_recommendations")
    .select("recommended_product_id, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (linkError || !links?.length) return [];

  const ids = links.map((l) => l.recommended_product_id as string);
  const { data, error } = await supabase
    .from("shop_products")
    .select(PRODUCT_COLUMNS)
    .in("id", ids)
    .eq("is_active", true);

  if (error || !data) return [];

  const byId = new Map(
    (data as ShopProductRow[]).map((row) => [row.id, mapShopProduct(row)]),
  );

  return ids
    .map((id) => byId.get(id))
    .filter((p): p is ShopProduct => Boolean(p));
}

export async function fetchRecommendationIds(
  supabase: SupabaseClient,
  productId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("shop_product_recommendations")
    .select("recommended_product_id")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data.map((r) => r.recommended_product_id as string);
}
