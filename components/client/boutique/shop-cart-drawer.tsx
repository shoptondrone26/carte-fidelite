"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { submitShopCartOrdersAction } from "@/actions/shop-orders";
import {
  PaymentFeeBreakdown,
  ShopPaymentSelector,
} from "@/components/client/boutique/shop-payment-selector";
import { buttonVariants } from "@/components/ui/button";
import { useShopCart, cartTotalEur } from "@/lib/boutique/cart";
import { fetchCatalogProducts, formatShopPrice } from "@/lib/boutique/products";
import {
  shopDeliveryLabelFr,
  type ShopDeliveryMethod,
} from "@/lib/boutique/orders";
import {
  computeShopPaymentTotals,
  type ShopPaymentMethod,
} from "@/lib/boutique/payment";
import {
  clientBottomSheetMaxHeightClass,
  clientBottomSheetPanelClass,
} from "@/lib/ui/safe-area";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type ShopCartDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrdersChanged?: () => void;
};

export function ShopCartDrawer({
  open,
  onOpenChange,
  onOrdersChanged,
}: ShopCartDrawerProps) {
  const {
    items,
    itemCount,
    setQuantity,
    removeProduct,
    clearCart,
    syncStockFromCatalog,
  } = useShopCart();
  const [delivery, setDelivery] = useState<ShopDeliveryMethod>("pickup");
  const [paymentMethod, setPaymentMethod] =
    useState<ShopPaymentMethod>("wire_transfer");
  const [pscAmount, setPscAmount] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const subtotalEur = useMemo(() => cartTotalEur(items), [items]);

  const paymentTotals = useMemo(
    () =>
      computeShopPaymentTotals(
        subtotalEur,
        delivery,
        paymentMethod,
        parsePscAmount(pscAmount),
      ),
    [subtotalEur, delivery, paymentMethod, pscAmount],
  );

  useEffect(() => {
    if (delivery === "pickup") {
      setPaymentMethod("wire_transfer");
      setPscAmount("");
    }
  }, [delivery]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      const supabase = createClient();
      try {
        const products = await fetchCatalogProducts(supabase);
        syncStockFromCatalog(products);
      } catch {
        /* garde le panier tel quel */
      }
    })();
  }, [open, syncStockFromCatalog]);

  if (!open) return null;

  function onSubmit() {
    if (items.length === 0) return;

    if (
      delivery === "chronopost_24h" &&
      paymentMethod === "mixed" &&
      parsePscAmount(pscAmount) <= 0
    ) {
      toast.error("Montant PSC requis", {
        description: "Indiquez le montant payé en Paysafecard.",
      });
      return;
    }

    if (
      delivery === "chronopost_24h" &&
      paymentMethod === "mixed" &&
      parsePscAmount(pscAmount) >= subtotalEur
    ) {
      toast.error("Montant PSC invalide", {
        description: "Le montant PSC doit être inférieur au sous-total produits.",
      });
      return;
    }

    startTransition(async () => {
      const res = await submitShopCartOrdersAction(
        items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          name: i.name,
        })),
        delivery,
        paymentMethod,
        parsePscAmount(pscAmount),
      );

      if (!res.ok) {
        toast.error("Envoi impossible", { description: res.error });
        return;
      }

      toast.success("Votre demande est envoyée", {
        description:
          "Rendez-vous sur Snapchat pour finaliser le paiement avec ShopTonDrone.",
      });
      clearCart();
      setDelivery("pickup");
      setPaymentMethod("wire_transfer");
      setPscAmount("");
      onOpenChange(false);

      router.refresh();
      onOrdersChanged?.();
      window.dispatchEvent(new CustomEvent("shop:orders-changed"));
    });
  }

  return (
    <div
      className="fixed inset-0 z-200 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shop-cart-title"
      onClick={() => !pending && onOpenChange(false)}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-lg flex-col rounded-t-[1.75rem] border border-white/10 bg-zinc-950/95 shadow-2xl animate-in slide-in-from-bottom-4 duration-300",
          clientBottomSheetMaxHeightClass,
          clientBottomSheetPanelClass,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-white/20" />

        <div className="flex shrink-0 items-center justify-between gap-3 px-1 pb-3">
          <div>
            <p
              id="shop-cart-title"
              className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/90"
            >
              Panier
            </p>
            <p className="text-xs text-zinc-500">
              {itemCount} article{itemCount > 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => onOpenChange(false)}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 text-zinc-300"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1">
          {items.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">
              Votre panier est vide.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex gap-3 rounded-xl border border-white/10 bg-black/30 p-2.5"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <p className="line-clamp-2 text-sm font-medium text-white">
                      {item.name}
                    </p>
                    <p className="text-xs tabular-nums text-amber-100/90">
                      {formatShopPrice(item.priceEur)} / unité
                      {item.quantity > 1
                        ? ` · ${formatShopPrice(item.priceEur * item.quantity)}`
                        : ""}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Stock : {item.stockMax}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-0.5">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            setQuantity(item.productId, item.quantity - 1)
                          }
                          className="flex size-7 items-center justify-center rounded-full text-zinc-300 hover:bg-white/10 disabled:opacity-40"
                          aria-label="Diminuer"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold tabular-nums text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={
                            pending || item.quantity >= item.stockMax
                          }
                          onClick={() =>
                            setQuantity(item.productId, item.quantity + 1)
                          }
                          className="flex size-7 items-center justify-center rounded-full text-zinc-300 hover:bg-white/10 disabled:opacity-40"
                          aria-label="Augmenter"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => removeProduct(item.productId)}
                        className="flex size-8 items-center justify-center rounded-full text-rose-300/90 hover:bg-rose-500/10"
                        aria-label="Retirer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <div className="mt-4 shrink-0 space-y-4 border-t border-white/8 pt-4 px-1">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                Livraison
              </p>
              {(["pickup", "chronopost_24h"] as const).map((method) => (
                <label
                  key={method}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition duration-200",
                    delivery === method
                      ? "border-amber-300/40 bg-amber-300/10"
                      : "border-white/10 bg-black/20",
                  )}
                >
                  <input
                    type="radio"
                    name="cart-delivery"
                    checked={delivery === method}
                    onChange={() => setDelivery(method)}
                    className="size-4 accent-amber-400"
                  />
                  <span className="text-sm text-white">
                    {shopDeliveryLabelFr[method]}
                  </span>
                </label>
              ))}
            </div>

            {delivery === "chronopost_24h" ? (
              <ShopPaymentSelector
                subtotalEur={subtotalEur}
                paymentMethod={paymentMethod}
                pscAmountEur={pscAmount}
                onPaymentMethodChange={setPaymentMethod}
                onPscAmountChange={setPscAmount}
                disabled={pending}
              />
            ) : (
              <PaymentFeeBreakdown totals={paymentTotals} />
            )}

            <p className="text-[11px] leading-relaxed text-zinc-500">
              Une commande groupée sera créée. Paiement manuel sur Snapchat.
            </p>

            <button
              type="button"
              disabled={pending}
              onClick={onSubmit}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-12 w-full justify-center bg-amber-500 text-black hover:bg-amber-400",
              )}
            >
              {pending ? "Envoi…" : "Envoyer ma demande"}
            </button>

            <button
              type="button"
              disabled={pending}
              onClick={clearCart}
              className="w-full py-1 text-center text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
            >
              Vider le panier
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function parsePscAmount(value: string): number {
  const n = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
