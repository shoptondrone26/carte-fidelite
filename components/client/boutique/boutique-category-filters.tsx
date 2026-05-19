"use client";

import { useEffect, useRef } from "react";

import {
  SHOP_CATALOG_FILTERS,
  type ShopCatalogFilterId,
} from "@/lib/boutique/categories";
import { cn } from "@/lib/utils";

type BoutiqueCategoryFiltersProps = {
  value: ShopCatalogFilterId;
  onChange: (value: ShopCatalogFilterId) => void;
};

export function BoutiqueCategoryFilters({
  value,
  onChange,
}: BoutiqueCategoryFiltersProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    const active = activeRef.current;
    if (!container || !active) return;
    const left =
      active.offsetLeft - container.clientWidth / 2 + active.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [value]);

  return (
    <div
      className="relative -mx-1 min-w-0 border-b border-amber-100/8 pb-1"
      role="group"
      aria-label="Filtrer par catégorie"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-amber-200/35 to-transparent"
      />
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-1 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SHOP_CATALOG_FILTERS.map((filter) => {
          const active = value === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              ref={(el) => {
                if (active) activeRef.current = el;
              }}
              onClick={() => onChange(filter.id)}
              className={cn(
                "relative shrink-0 rounded-full px-4 py-2 text-xs font-semibold tracking-tight transition duration-300 active:scale-[0.97]",
                active
                  ? "bg-amber-500/20 text-amber-50 ring-1 ring-amber-400/35 shadow-sm shadow-amber-900/25 shadow-[0_0_22px_rgba(245,158,11,0.14)]"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200",
              )}
              aria-pressed={active}
            >
              {active ? (
                <span
                  aria-hidden
                  className="premium-ambient pointer-events-none absolute inset-x-3 -bottom-px h-4 rounded-full bg-amber-300/20 blur-md"
                />
              ) : null}
              <span className="relative">{filter.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
