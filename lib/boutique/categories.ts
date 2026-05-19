export const SHOP_CATEGORY_SLUGS = [
  "general",
  "accessoires",
  "drones",
  "pieces",
  "autre",
] as const;

export type ShopCategorySlug = (typeof SHOP_CATEGORY_SLUGS)[number];

export const SHOP_CATEGORY_LABELS: Record<ShopCategorySlug, string> = {
  general: "Général",
  accessoires: "Accessoires",
  drones: "Drones",
  pieces: "Pièces",
  autre: "Autre",
};

export function shopCategoryLabel(slug: string): string {
  return (
    SHOP_CATEGORY_LABELS[slug as ShopCategorySlug] ??
    slug.charAt(0).toUpperCase() + slug.slice(1)
  );
}
