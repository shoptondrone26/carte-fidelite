"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";

import { BoutiqueCatalog } from "@/components/client/boutique/boutique-catalog";
import { BoutiqueCategoryFilters } from "@/components/client/boutique/boutique-category-filters";
import { BoutiqueOrdersPanel } from "@/components/client/boutique/boutique-orders-panel";
import { buttonVariants } from "@/components/ui/button";
import { useClientShopOrdersRealtime } from "@/hooks/use-client-shop-orders-realtime";
import { useShopCart } from "@/lib/boutique/cart";
import type { ShopCatalogFilterId } from "@/lib/boutique/categories";
import type { ShopOrder } from "@/lib/boutique/orders";
import type { ShopProduct } from "@/lib/boutique/types";
import { cn } from "@/lib/utils";

type BoutiqueLiveProps = {
  products: ShopProduct[];
  initialOrders: ShopOrder[];
  userId: string;
};

export function BoutiqueLive({
  products,
  initialOrders,
  userId,
}: BoutiqueLiveProps) {
  const { orders, refetch } = useClientShopOrdersRealtime(initialOrders, userId);
  const { count: cartCount } = useShopCart();
  const [filter, setFilter] = useState<ShopCatalogFilterId>("all");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <section className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-amber-200/15 bg-linear-to-r from-amber-500/8 via-zinc-950 to-black px-4 py-3">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-amber-100/40 to-transparent"
          />
          <p className="text-sm text-zinc-400">
            Catalogue membre — ajoutez au panier puis finalisez sur Snapchat.
          </p>
        </section>
        {cartCount > 0 ? (
          <div
            className="flex shrink-0 flex-col items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-500/10 px-3 py-2"
            title="Articles dans le panier"
          >
            <ShoppingBag className="size-5 text-amber-200" aria-hidden />
            <span className="mt-0.5 text-[10px] font-bold tabular-nums text-amber-100">
              {cartCount}
            </span>
          </div>
        ) : null}
      </div>

      <BoutiqueCategoryFilters value={filter} onChange={setFilter} />

      <BoutiqueOrdersPanel orders={orders} onChanged={refetch} />

      <BoutiqueCatalog
        initialProducts={products}
        activeOrders={orders}
        onOrdersChanged={refetch}
        filter={filter}
        onClearFilter={() => setFilter("all")}
      />

      <Link
        href="/dashboard"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "h-11 w-full justify-center gap-2 border-amber-300/20 bg-black/25 text-amber-100 hover:bg-amber-300/10",
        )}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour à la Carte
      </Link>
    </div>
  );
}
