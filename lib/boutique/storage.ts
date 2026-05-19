import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const SHOP_PRODUCTS_BUCKET = "shop-products";

export function buildShopProductImagePath(
  productId: string,
  fileName: string,
): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  return `${productId}/${Date.now()}-${safe}`;
}

export function getShopProductPublicUrl(storagePath: string): string {
  const { url } = getSupabasePublicEnv();
  return `${url}/storage/v1/object/public/${SHOP_PRODUCTS_BUCKET}/${storagePath}`;
}
