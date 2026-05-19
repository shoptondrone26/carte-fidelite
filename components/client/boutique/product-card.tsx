import Image from "next/image";

import { shopCategoryLabel } from "@/lib/boutique/categories";
import { formatShopPrice } from "@/lib/boutique/products";
import type { ShopProduct } from "@/lib/boutique/types";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: ShopProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  const outOfStock = product.stock <= 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-lg shadow-black/30 transition duration-500 hover:border-amber-200/25">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-0 z-10 h-px bg-linear-to-r from-transparent via-amber-100/30 to-transparent opacity-0 transition duration-500 group-hover:opacity-100"
      />
      <div className="relative aspect-4/3 overflow-hidden bg-zinc-900">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            unoptimized
            className="object-cover transition duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 512px) 50vw, 240px"
          />
        ) : (
          <div className="flex h-full min-h-32 items-center justify-center bg-linear-to-br from-zinc-900 to-black text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-600">
            ShopTonDrone
          </div>
        )}
        <StockBadge outOfStock={outOfStock} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/70">
          {shopCategoryLabel(product.category)}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">
          {product.name}
        </h3>
        {product.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">
            {product.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <p className="text-lg font-semibold tabular-nums text-amber-100">
            {formatShopPrice(product.price_eur)}
          </p>
          <p className="text-[10px] text-zinc-500">Stock {product.stock}</p>
        </div>
      </div>
    </article>
  );
}

function StockBadge({ outOfStock }: { outOfStock: boolean }) {
  return (
    <span
      className={cn(
        "absolute right-2 top-2 z-10 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm",
        outOfStock
          ? "border-rose-400/35 bg-rose-500/20 text-rose-100"
          : "border-emerald-400/35 bg-emerald-500/20 text-emerald-100",
      )}
    >
      {outOfStock ? "Rupture" : "Disponible"}
    </span>
  );
}
