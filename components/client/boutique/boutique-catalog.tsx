"use client";

import { useMemo } from "react";
import { Package } from "lucide-react";

import { ProductCard } from "@/components/client/boutique/product-card";
import { useShopCatalogRealtime } from "@/hooks/use-shop-catalog-realtime";
import {
  matchesShopCatalogFilter,
  shopCategoryLabel,
  type ShopCatalogFilterId,
} from "@/lib/boutique/categories";
import { groupProductsByCategory } from "@/lib/boutique/products";
import type { ShopOrder } from "@/lib/boutique/orders";
import type { ShopProduct } from "@/lib/boutique/types";

type BoutiqueCatalogProps = {
  initialProducts: ShopProduct[];
  activeOrders: ShopOrder[];
  onOrdersChanged: () => void;
  filter: ShopCatalogFilterId;
  onClearFilter: () => void;
};

function ProductGrid({ products }: { products: ShopProduct[] }) {
  return (
    <ul className="grid min-w-0 grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <li key={product.id} className="min-w-0">
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}

export function BoutiqueCatalog({
  initialProducts,
  filter,
  onClearFilter,
}: BoutiqueCatalogProps) {
  const { products } = useShopCatalogRealtime(initialProducts);

  const filteredProducts = useMemo(
    () => products.filter((p) => matchesShopCatalogFilter(p.category, filter)),
    [products, filter],
  );

  const grouped = useMemo(
    () => groupProductsByCategory(filteredProducts),
    [filteredProducts],
  );

  const filterLabel = filter === "all" ? null : shopCategoryLabel(filter);

  if (products.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-amber-300/20 bg-black/25 px-6 py-12 text-center">
        <Package
          className="mx-auto size-10 text-amber-200/50"
          aria-hidden
        />
        <p className="mt-3 text-sm font-medium text-zinc-300">
          Catalogue en préparation
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Les produits membres seront bientôt disponibles ici.
        </p>
      </section>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-amber-300/15 bg-black/25 px-6 py-10 text-center">
        <p className="text-sm font-medium text-zinc-300">
          Aucun produit dans cette catégorie
          {filterLabel ? ` (${filterLabel})` : ""}.
        </p>
        <button
          type="button"
          onClick={onClearFilter}
          className="mt-3 text-xs font-semibold text-amber-200/90 underline-offset-2 hover:underline"
        >
          Voir tous les produits
        </button>
      </section>
    );
  }

  if (filter === "all") {
    return (
      <div className="flex min-w-0 flex-col gap-6 overflow-x-hidden sm:gap-8">
        {grouped.map((group) => (
          <section
            key={group.category}
            className="min-w-0 space-y-2.5 sm:space-y-3"
          >
            <h2 className="px-0.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/75">
              {group.label}
            </h2>
            <ProductGrid products={group.products} />
          </section>
        ))}
      </div>
    );
  }

  return (
    <section className="min-w-0 space-y-2.5 sm:space-y-3">
      <h2 className="px-0.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/75">
        {filterLabel}
      </h2>
      <ProductGrid products={filteredProducts} />
    </section>
  );
}
