"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { cancelShopOrderAction } from "@/actions/shop-orders";
import { buttonVariants } from "@/components/ui/button";
import { formatShopPrice } from "@/lib/boutique/products";
import {
  shopDeliveryLabelFr,
  shopOrderClientMessage,
  shopOrderDisplayTitle,
  shopOrderLineItems,
  shopOrderStatusLabelFr,
  type ShopOrder,
} from "@/lib/boutique/orders";
import { cn } from "@/lib/utils";

type BoutiqueOrdersPanelProps = {
  orders: ShopOrder[];
  onChanged: () => void;
};

export function BoutiqueOrdersPanel({
  orders,
  onChanged,
}: BoutiqueOrdersPanelProps) {
  if (orders.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/75">
        Mes commandes
      </h2>
      <ul className="flex flex-col gap-3">
        {orders.map((order) => (
          <BoutiqueOrderCard key={order.id} order={order} onChanged={onChanged} />
        ))}
      </ul>
    </section>
  );
}

function BoutiqueOrderCard({
  order,
  onChanged,
}: {
  order: ShopOrder;
  onChanged: () => void;
}) {
  const [pending, start] = useTransition();
  const canCancel = order.status === "payment_pending";
  const lines = shopOrderLineItems(order);

  function cancel() {
    start(async () => {
      const res = await cancelShopOrderAction(order.id);
      if (res.ok) {
        toast.success("Commande annulée");
        onChanged();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <li className="rounded-2xl border border-amber-200/15 bg-linear-to-br from-amber-500/10 via-card/35 to-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-white">{shopOrderDisplayTitle(order)}</p>
          {lines.length > 1 ? (
            <ul className="mt-2 space-y-1">
              {lines.map((line) => (
                <li
                  key={line.id}
                  className="flex justify-between gap-2 text-xs text-zinc-400"
                >
                  <span>
                    {line.product_name}
                    {line.quantity > 1 ? ` × ${line.quantity}` : ""}
                  </span>
                  <span className="tabular-nums">
                    {formatShopPrice(line.line_total_eur)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-2 text-sm tabular-nums text-amber-100">
            {formatShopPrice(order.total_price_eur)}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {shopDeliveryLabelFr[order.delivery_method]}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-[11px] font-semibold text-sky-100">
          {shopOrderStatusLabelFr[order.status]}
        </span>
      </div>

      <p className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs leading-relaxed text-zinc-300">
        {shopOrderClientMessage(order.status)}
      </p>

      {order.tracking_number ? (
        <p className="mt-2 text-xs text-violet-200/90">
          Suivi colis : {order.tracking_number}
        </p>
      ) : null}

      {order.status === "payment_pending" ? (
        <p className="mt-2 text-[11px] text-zinc-500">
          Réservation jusqu’au{" "}
          {new Date(order.expires_at).toLocaleString("fr-FR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      ) : null}

      {canCancel ? (
        <button
          type="button"
          disabled={pending}
          onClick={cancel}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "mt-3 h-10 w-full justify-center border-rose-500/35 text-rose-100 hover:bg-rose-500/10",
          )}
        >
          Annuler la demande
        </button>
      ) : null}
    </li>
  );
}
