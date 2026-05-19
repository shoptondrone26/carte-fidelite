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

/** Filtres catalogue client (pills au-dessus de la grille). */
export type ShopCatalogFilterId = "all" | "drones" | "accessoires" | "autre";

export const SHOP_CATALOG_FILTERS: ReadonlyArray<{
  id: ShopCatalogFilterId;
  label: string;
}> = [
  { id: "all", label: "Tous" },
  { id: "drones", label: "Drones" },
  { id: "accessoires", label: "Accessoires" },
  { id: "autre", label: "Autre" },
] as const;

export function matchesShopCatalogFilter(
  category: string,
  filter: ShopCatalogFilterId,
): boolean {
  if (filter === "all") return true;
  return category === filter;
}

export function shopCategoryLabel(slug: string): string {
  return (
    SHOP_CATEGORY_LABELS[slug as ShopCategorySlug] ??
    slug.charAt(0).toUpperCase() + slug.slice(1)
  );
}
