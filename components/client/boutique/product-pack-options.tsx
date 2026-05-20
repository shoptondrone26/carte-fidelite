"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";

import { productPrimaryImage } from "@/lib/boutique/images";
import { formatShopPrice } from "@/lib/boutique/products";
import type { ShopProduct } from "@/lib/boutique/types";
import { cn } from "@/lib/utils";

export type ProductPackOptionsProps = {
  mainProduct: ShopProduct;
  options: ShopProduct[];
  selectedIds: Set<string>;
  onToggle: (productId: string) => void;
};

export function useProductPackSelection(options: ShopProduct[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  function toggle(productId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  const selectedProducts = useMemo(
    () => options.filter((p) => selectedIds.has(p.id)),
    [options, selectedIds],
  );

  return { selectedIds, toggle, selectedProducts };
}

export function computePackTotal(
  mainProduct: ShopProduct,
  selected: ShopProduct[],
): number {
  return (
    mainProduct.price_eur +
    selected.reduce((sum, p) => sum + p.price_eur, 0)
  );
}

export function ProductPackOptions({
  mainProduct,
  options,
  selectedIds,
  onToggle,
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
          Accessoires compatibles — stock vérifié à l&apos;envoi de la demande.
        </p>
      </div>

      <ul className="space-y-2">
        {items.map((option) => (
          <PackOptionRow
            key={option.id}
            option={option}
            selected={selectedIds.has(option.id)}
            onToggle={() => onToggle(option.id)}
          />
        ))}
      </ul>
    </section>
  );
}

function PackOptionRow({
  option,
  selected,
  onToggle,
}: {
  option: ShopProduct;
  selected: boolean;
  onToggle: () => void;
}) {
  const image = productPrimaryImage(option);
  const outOfStock = option.stock <= 0;
  const disabled = outOfStock;

  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        aria-pressed={selected}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
          disabled && "cursor-not-allowed opacity-55",
          !disabled && selected
            ? "border-amber-400/35 bg-amber-500/10 ring-1 ring-amber-400/20"
            : "border-white/8 bg-black/25 hover:border-white/15 hover:bg-black/35",
        )}
      >
        <span
          className={cn(
            "relative size-12 shrink-0 overflow-hidden rounded-lg border bg-zinc-900",
            selected && !disabled
              ? "border-amber-400/30"
              : "border-white/10",
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

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white">
            {option.name}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold tabular-nums text-amber-100/90">
              {formatShopPrice(option.price_eur)}
            </span>
            {outOfStock ? (
              <span className="rounded-full border border-rose-400/35 bg-rose-950/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-100">
                Rupture
              </span>
            ) : (
              <span className="text-[10px] text-zinc-500">
                {option.stock} en stock
              </span>
            )}
          </span>
        </span>

        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border transition",
            disabled && "border-white/10 bg-white/5",
            !disabled && selected
              ? "border-amber-400 bg-amber-400 text-black"
              : "border-white/20 bg-transparent text-transparent",
          )}
          aria-hidden
        >
          <Check className="size-4" strokeWidth={3} />
        </span>
      </button>
    </li>
  );
}

export function PackTotalSummary({
  mainProduct,
  selected,
  className,
}: {
  mainProduct: ShopProduct;
  selected: ShopProduct[];
  className?: string;
}) {
  const total = computePackTotal(mainProduct, selected);

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border border-white/8 bg-black/35 px-3 py-3",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate text-zinc-400">{mainProduct.name}</span>
        <span className="shrink-0 tabular-nums text-zinc-200">
          {formatShopPrice(mainProduct.price_eur)}
        </span>
      </div>
      {selected.map((opt) => (
        <div
          key={opt.id}
          className="flex items-baseline justify-between gap-2 text-sm"
        >
          <span className="truncate text-zinc-500">+ {opt.name}</span>
          <span className="shrink-0 tabular-nums text-zinc-400">
            {formatShopPrice(opt.price_eur)}
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
