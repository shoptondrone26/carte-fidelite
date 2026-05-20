"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";

import { productPrimaryImage } from "@/lib/boutique/images";
import { formatShopPrice } from "@/lib/boutique/products";
import type { ShopProduct } from "@/lib/boutique/types";
import { cn } from "@/lib/utils";

export type PackLine = { product: ShopProduct; quantity: number };

export type ProductPackOptionsProps = {
  mainProduct: ShopProduct;
  options: ShopProduct[];
  quantities: Record<string, number>;
  onQuantityChange: (productId: string, quantity: number) => void;
};

export function useProductPackQuantities(options: ShopProduct[]) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  function setQuantity(productId: string, next: number) {
    const product = options.find((p) => p.id === productId);
    if (!product || product.stock <= 0) return;
    const clamped = Math.max(0, Math.min(Math.floor(next), product.stock));
    setQuantities((prev) => {
      if (clamped <= 0) {
        const { [productId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: clamped };
    });
  }

  const packLines = useMemo((): PackLine[] => {
    return options
      .map((product) => ({
        product,
        quantity: quantities[product.id] ?? 0,
      }))
      .filter((line) => line.quantity > 0);
  }, [options, quantities]);

  const hasSelectedOptions = packLines.length > 0;

  return {
    quantities,
    setQuantity,
    packLines,
    hasSelectedOptions,
  };
}

export function computePackSubtotal(
  mainProduct: ShopProduct,
  mainQuantity: number,
  lines: PackLine[],
): number {
  const main = mainProduct.price_eur * Math.max(1, mainQuantity);
  const options = lines.reduce(
    (sum, line) => sum + line.product.price_eur * line.quantity,
    0,
  );
  return main + options;
}

export function ProductPackOptions({
  mainProduct,
  options,
  quantities,
  onQuantityChange,
}: ProductPackOptionsProps) {
  const items = options.filter((p) => p.id !== mainProduct.id);

  if (items.length === 0) return null;

  return (
    <section className="space-y-3 rounded-2xl border border-amber-200/12 bg-linear-to-br from-amber-500/[0.06] via-black/40 to-black/50 px-4 py-4">
      <div>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-200/80">
          Compléter votre pack
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Ajustez les quantités — stock vérifié à l&apos;envoi de la demande.
        </p>
      </div>

      <ul className="space-y-2">
        {items.map((option) => (
          <PackOptionRow
            key={option.id}
            option={option}
            quantity={quantities[option.id] ?? 0}
            onQuantityChange={onQuantityChange}
          />
        ))}
      </ul>
    </section>
  );
}

function PackOptionRow({
  option,
  quantity,
  onQuantityChange,
}: {
  option: ShopProduct;
  quantity: number;
  onQuantityChange: (productId: string, quantity: number) => void;
}) {
  const image = productPrimaryImage(option);
  const outOfStock = option.stock <= 0;
  const selected = quantity > 0;
  const lineTotal = option.price_eur * quantity;

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition duration-300",
        outOfStock && "cursor-not-allowed opacity-55",
        !outOfStock && selected
          ? "border-amber-400/35 bg-amber-500/10 ring-1 ring-amber-400/15"
          : "border-white/8 bg-black/25",
      )}
    >
      <span
        className={cn(
          "relative size-12 shrink-0 overflow-hidden rounded-lg border bg-zinc-900",
          selected ? "border-amber-400/30" : "border-white/10",
        )}
      >
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-[8px] text-zinc-600">
            —
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{option.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold tabular-nums text-amber-100/90">
            {formatShopPrice(option.price_eur)}
          </span>
          {selected ? (
            <span className="text-[10px] tabular-nums text-zinc-500">
              = {formatShopPrice(lineTotal)}
            </span>
          ) : null}
          {outOfStock ? (
            <span className="rounded-full border border-rose-400/35 bg-rose-950/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-100">
              Rupture
            </span>
          ) : (
            <span className="text-[10px] text-zinc-500">
              {option.stock} en stock
            </span>
          )}
        </div>
      </div>

      {outOfStock ? null : (
        <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-white/12 bg-black/50 p-0.5">
          <button
            type="button"
            disabled={quantity <= 0}
            onClick={() => onQuantityChange(option.id, quantity - 1)}
            className="flex size-8 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white/10 disabled:opacity-30"
            aria-label={`Diminuer ${option.name}`}
          >
            <Minus className="size-3.5" />
          </button>
          <span className="min-w-7 text-center text-sm font-semibold tabular-nums text-white">
            {quantity}
          </span>
          <button
            type="button"
            disabled={quantity >= option.stock}
            onClick={() => onQuantityChange(option.id, quantity + 1)}
            className="flex size-8 items-center justify-center rounded-full text-amber-100 transition hover:bg-amber-400/15 disabled:opacity-30"
            aria-label={`Augmenter ${option.name}`}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      )}
    </li>
  );
}

export function PackTotalSummary({
  mainProduct,
  mainQuantity,
  lines,
  className,
}: {
  mainProduct: ShopProduct;
  mainQuantity?: number;
  lines: PackLine[];
  className?: string;
}) {
  const mainQty = Math.max(1, mainQuantity ?? 1);
  const total = computePackSubtotal(mainProduct, mainQty, lines);

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border border-white/8 bg-black/35 px-3 py-3 transition-all duration-300",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate text-zinc-400">
          {mainProduct.name}
          {mainQty > 1 ? ` × ${mainQty}` : ""}
        </span>
        <span className="shrink-0 tabular-nums text-zinc-200">
          {formatShopPrice(mainProduct.price_eur * mainQty)}
        </span>
      </div>
      {lines.map((line) => (
        <div
          key={line.product.id}
          className="flex items-baseline justify-between gap-2 text-sm"
        >
          <span className="truncate text-zinc-500">
            + {line.product.name}
            {line.quantity > 1 ? ` × ${line.quantity}` : ""}
          </span>
          <span className="shrink-0 tabular-nums text-zinc-400">
            {formatShopPrice(line.product.price_eur * line.quantity)}
          </span>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-2 border-t border-white/8 pt-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-amber-200/80">
          Total pack
        </span>
        <span className="text-lg font-semibold tabular-nums text-amber-50">
          {formatShopPrice(total)}
        </span>
      </div>
    </div>
  );
}
