import type { ShopProduct } from "@/lib/boutique/types";

export const MAX_PRODUCT_IMAGES = 3;

export function productImageUrls(product: Pick<ShopProduct, "image_urls" | "image_url">): string[] {
  const fromArray = product.image_urls?.filter(Boolean) ?? [];
  if (fromArray.length > 0) {
    return fromArray.slice(0, MAX_PRODUCT_IMAGES);
  }
  if (product.image_url) return [product.image_url];
  return [];
}

export function productPrimaryImage(
  product: Pick<ShopProduct, "image_urls" | "image_url" | "primary_image_index">,
): string | null {
  const urls = productImageUrls(product);
  if (urls.length === 0) return null;
  const idx = Math.min(
    Math.max(0, product.primary_image_index ?? 0),
    urls.length - 1,
  );
  return urls[idx] ?? urls[0] ?? null;
}
