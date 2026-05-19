"use client";

import { Package } from "lucide-react";

import { ProductCard } from "@/components/client/boutique/product-card";
import { useShopCatalogRealtime } from "@/hooks/use-shop-catalog-realtime";
import type { ShopOrder } from "@/lib/boutique/orders";
import type { ShopProduct } from "@/lib/boutique/types";

type BoutiqueCatalogProps = {
  initialProducts: ShopProduct[];
  activeOrders: ShopOrder[];
  onOrdersChanged: () => void;
};

export function BoutiqueCatalog({
  initialProducts,
  activeOrders,
  onOrdersChanged,
}: BoutiqueCatalogProps) {
  const { products, categories } = useShopCatalogRealtime(initialProducts);

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

  return (
    <div className="flex flex-col gap-8">
      {categories.map((group) => (
        <section key={group.category} className="space-y-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/75">
            {group.label}
          </h2>
          <ul className="grid grid-cols-2 gap-3">
            {group.products.map((product) => (
              <li key={product.id}>
                <ProductCard
                  product={product}
                  activeOrders={activeOrders}
                  onOrdered={onOrdersChanged}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
