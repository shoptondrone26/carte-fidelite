"use client";

import { useState } from "react";
import Image from "next/image";

import { ProductOrderSheet } from "@/components/client/boutique/product-order-sheet";
import { buttonVariants } from "@/components/ui/button";
import { shopCategoryLabel } from "@/lib/boutique/categories";
import { formatShopPrice } from "@/lib/boutique/products";
import type { ShopOrder } from "@/lib/boutique/orders";
import type { ShopProduct } from "@/lib/boutique/types";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: ShopProduct;
  activeOrders: ShopOrder[];
  onOrdered: () => void;
};

export function ProductCard({
  product,
  activeOrders,
  onOrdered,
}: ProductCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const outOfStock = product.stock <= 0;
  const hasActiveOrder = activeOrders.some(
    (order) => order.product_id === product.id,
  );

  const ctaLabel = hasActiveOrder
    ? "En cours"
    : outOfStock
      ? "Rupture"
      : "Demander";

  return (
    <>
      <article
        className={cn(
          "group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-linear-to-b from-zinc-900/90 to-black/80 shadow-md shadow-black/40",
          "transition duration-300 ease-out",
          "hover:border-amber-200/30 hover:shadow-lg hover:shadow-amber-950/20",
          "active:scale-[0.98] motion-reduce:active:scale-100",
          "sm:rounded-2xl",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-3 top-0 z-10 h-px bg-linear-to-r from-transparent via-amber-100/35 to-transparent opacity-0 transition duration-300 group-hover:opacity-100"
        />

        <div className="relative aspect-square overflow-hidden bg-zinc-900">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              unoptimized
              className="object-cover transition duration-500 ease-out group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 240px"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-linear-to-br from-zinc-900 via-zinc-950 to-black px-2 text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-600 sm:text-[10px]">
              ShopTonDrone
            </div>
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent"
          />
          <StockBadge outOfStock={outOfStock} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-3">
          <p className="truncate text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-200/65 sm:text-[10px] sm:tracking-[0.2em]">
            {shopCategoryLabel(product.category)}
          </p>
          <h3 className="line-clamp-2 min-h-8 text-xs font-semibold leading-snug text-white sm:min-h-0 sm:text-sm">
            {product.name}
          </h3>
          {product.description ? (
            <p className="hidden line-clamp-2 text-xs leading-relaxed text-zinc-500 sm:block">
              {product.description}
            </p>
          ) : null}

          <div className="mt-auto flex flex-col gap-1.5 pt-0.5 sm:gap-2 sm:pt-1">
            <div className="flex items-baseline justify-between gap-1">
              <p className="text-base font-semibold tabular-nums tracking-tight text-amber-50 sm:text-lg">
                {formatShopPrice(product.price_eur)}
              </p>
              <p className="shrink-0 text-[9px] tabular-nums text-zinc-500 sm:text-[10px]">
                ×{product.stock}
              </p>
            </div>
            <button
              type="button"
              disabled={outOfStock || hasActiveOrder}
              onClick={() => setSheetOpen(true)}
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "h-8 w-full justify-center rounded-lg bg-amber-400/95 text-[10px] font-bold tracking-wide text-black shadow-sm shadow-amber-900/30",
                "transition hover:bg-amber-300 active:bg-amber-500 disabled:opacity-45",
                "sm:h-9 sm:rounded-xl sm:text-xs",
              )}
            >
              <span className="sm:hidden">{ctaLabel}</span>
              <span className="hidden sm:inline">
                {hasActiveOrder
                  ? "Commande en cours"
                  : outOfStock
                    ? "Rupture"
                    : "Demander ce produit"}
              </span>
            </button>
          </div>
        </div>
      </article>

      <ProductOrderSheet
        product={product}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        hasActiveOrder={hasActiveOrder}
        onOrdered={onOrdered}
      />
    </>
  );
}

function StockBadge({ outOfStock }: { outOfStock: boolean }) {
  return (
    <span
      className={cn(
        "absolute left-1.5 top-1.5 z-10 rounded-md border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide shadow-sm backdrop-blur-sm sm:left-2 sm:top-2 sm:rounded-full sm:px-2 sm:text-[9px]",
        outOfStock
          ? "border-rose-400/40 bg-rose-950/70 text-rose-100"
          : "border-emerald-400/35 bg-emerald-950/70 text-emerald-100",
      )}
    >
      {outOfStock ? "Rupture" : "Dispo"}
    </span>
  );
}
