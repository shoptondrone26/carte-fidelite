"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { createShopOrderAction } from "@/actions/shop-orders";
import { buttonVariants } from "@/components/ui/button";
import { formatShopPrice } from "@/lib/boutique/products";
import {
  shopDeliveryLabelFr,
  type ShopDeliveryMethod,
} from "@/lib/boutique/orders";
import type { ShopProduct } from "@/lib/boutique/types";
import { cn } from "@/lib/utils";

type ProductOrderSheetProps = {
  product: ShopProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasActiveOrder: boolean;
  onOrdered: () => void;
};

export function ProductOrderSheet({
  product,
  open,
  onOpenChange,
  hasActiveOrder,
  onOrdered,
}: ProductOrderSheetProps) {
  const [delivery, setDelivery] = useState<ShopDeliveryMethod>("pickup");
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const outOfStock = product.stock <= 0;

  function submit() {
    start(async () => {
      const res = await createShopOrderAction(product.id, delivery);
      if (res.ok) {
        toast.success("Demande envoyée");
        onOpenChange(false);
        onOrdered();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-200 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-order-title"
      onClick={() => !pending && onOpenChange(false)}
    >
      <div
        className="mx-auto w-full max-w-lg rounded-t-[1.75rem] border border-white/10 bg-zinc-950/95 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p
                id="product-order-title"
                className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/90"
              >
                Commande boutique
              </p>
              <p className="mt-1 text-sm font-medium text-white">{product.name}</p>
              <p className="text-lg font-semibold tabular-nums text-amber-100">
                {formatShopPrice(product.price_eur)}
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => onOpenChange(false)}
              className="flex size-9 items-center justify-center rounded-full bg-white/10 text-zinc-300 disabled:opacity-50"
              aria-label="Fermer"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <p className="mb-4 text-xs text-zinc-400">
            Choisissez le mode de livraison. Le paiement se fait manuellement sur
            Snapchat avec ShopTonDrone.
          </p>

          <div className="mb-5 flex flex-col gap-2">
            {(["pickup", "chronopost_24h"] as const).map((method) => (
              <label
                key={method}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition",
                  delivery === method
                    ? "border-amber-300/40 bg-amber-300/10"
                    : "border-white/10 bg-black/20 hover:border-white/20",
                )}
              >
                <input
                  type="radio"
                  name="delivery"
                  value={method}
                  checked={delivery === method}
                  onChange={() => setDelivery(method)}
                  className="size-4 accent-amber-400"
                />
                <span className="text-sm font-medium text-white">
                  {shopDeliveryLabelFr[method]}
                </span>
              </label>
            ))}
          </div>

          {hasActiveOrder ? (
            <p className="mb-3 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Une commande est déjà en cours pour ce produit.
            </p>
          ) : null}

          <button
            type="button"
            disabled={pending || outOfStock || hasActiveOrder}
            onClick={submit}
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "h-12 w-full justify-center bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50",
            )}
          >
            {outOfStock ? "Rupture de stock" : "Demander ce produit"}
          </button>
      </div>
    </div>
  );
}
