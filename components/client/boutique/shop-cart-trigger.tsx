"use client";

import { ShoppingBag } from "lucide-react";

import { useShopCart, useShopCartUi } from "@/lib/boutique/cart";
import { cn } from "@/lib/utils";

type ShopCartTriggerProps = {
  className?: string;
};

export function ShopCartTrigger({ className }: ShopCartTriggerProps) {
  const { itemCount } = useShopCart();
  const { openCart } = useShopCartUi();

  return (
    <button
      type="button"
      onClick={openCart}
      className={cn(
        "relative flex shrink-0 flex-col items-center justify-center rounded-2xl border px-3 py-2 transition active:scale-[0.97]",
        itemCount > 0
          ? "border-amber-300/30 bg-amber-500/15 shadow-[0_0_22px_rgba(245,158,11,0.12)]"
          : "border-white/10 bg-black/30 hover:border-amber-300/20",
        className,
      )}
      aria-label={
        itemCount > 0
          ? `Ouvrir le panier, ${itemCount} article${itemCount > 1 ? "s" : ""}`
          : "Ouvrir le panier"
      }
    >
      <ShoppingBag
        className={cn(
          "size-5",
          itemCount > 0 ? "text-amber-200" : "text-zinc-500",
        )}
        aria-hidden
      />
      <span
        className={cn(
          "mt-0.5 text-[10px] font-bold tabular-nums",
          itemCount > 0 ? "text-amber-100" : "text-zinc-600",
        )}
      >
        {itemCount > 0 ? itemCount : "Panier"}
      </span>
    </button>
  );
}
