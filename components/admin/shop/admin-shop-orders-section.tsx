"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { adminUpdateShopOrderStatusAction } from "@/actions/shop-orders";
import { buttonVariants } from "@/components/ui/button";
import { formatShopPrice } from "@/lib/boutique/products";
import {
  shopDeliveryLabelFr,
  shopOrderStatusLabelFr,
  type AdminShopOrder,
  type ShopOrderStatus,
} from "@/lib/boutique/orders";
import { cn } from "@/lib/utils";

type AdminShopOrdersSectionProps = {
  orders: AdminShopOrder[];
};

type AdminShopOrderActionStatus = Exclude<
  ShopOrderStatus,
  "payment_pending" | "expired"
>;

function statusTone(status: ShopOrderStatus): string {
  switch (status) {
    case "payment_pending":
      return "border-sky-400/30 bg-sky-400/10 text-sky-100";
    case "paid":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
    case "preparing":
      return "border-amber-400/30 bg-amber-400/10 text-amber-100";
    case "shipped":
      return "border-violet-400/30 bg-violet-400/10 text-violet-100";
    case "completed":
      return "border-emerald-300/40 bg-emerald-300/15 text-emerald-50";
    case "refused":
    case "cancelled":
      return "border-rose-400/30 bg-rose-400/10 text-rose-100";
    default:
      return "border-white/20 bg-white/5 text-zinc-300";
  }
}

export function AdminShopOrdersSection({ orders }: AdminShopOrdersSectionProps) {
  const [busy, start] = useTransition();

  function updateStatus(
    orderId: string,
    status: AdminShopOrderActionStatus,
    message: string,
  ) {
    start(async () => {
      const res = await adminUpdateShopOrderStatusAction(orderId, status);
      if (res.ok) {
        toast.success(message);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/75">
            Boutique
          </p>
          <h2 className="text-lg font-semibold tracking-tight">
            Commandes à traiter
          </h2>
        </div>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
          {orders.length}
        </span>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
          Aucune commande boutique à traiter.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => {
            const profile = order.profiles;
            return (
              <li
                key={order.id}
                className="flex flex-col gap-4 rounded-2xl border border-amber-200/15 bg-linear-to-br from-amber-500/10 via-card/35 to-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {profile?.full_name?.trim() || profile?.email || "Client"}
                      </p>
                      {profile?.email ? (
                        <p className="text-xs text-muted-foreground">
                          {profile.email}
                        </p>
                      ) : null}
                      {profile?.snap ? (
                        <p className="text-xs text-amber-100/80">{profile.snap}</p>
                      ) : null}
                      <p className="mt-2 text-sm font-medium text-white">
                        {order.product_name}
                      </p>
                      <p className="text-sm tabular-nums text-amber-100">
                        {formatShopPrice(order.total_price_eur)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {shopDeliveryLabelFr[order.delivery_method]}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Demandé le{" "}
                        {new Date(order.created_at).toLocaleString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {order.status === "payment_pending" ? (
                        <p className="mt-1 text-[11px] text-zinc-500">
                          Expire le{" "}
                          {new Date(order.expires_at).toLocaleString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                        statusTone(order.status),
                      )}
                    >
                      {shopOrderStatusLabelFr[order.status]}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {order.status === "payment_pending" ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          updateStatus(order.id, "paid", "Paiement reçu")
                        }
                        className={cn(
                          buttonVariants({ variant: "default", size: "lg" }),
                          "h-11 justify-center bg-emerald-600 text-white hover:bg-emerald-600/90",
                        )}
                      >
                        Paiement reçu
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          updateStatus(order.id, "refused", "Commande refusée")
                        }
                        className={cn(
                          buttonVariants({ variant: "outline", size: "lg" }),
                          "h-11 justify-center border-rose-500/40 text-rose-100 hover:bg-rose-500/10",
                        )}
                      >
                        Refuser
                      </button>
                    </>
                  ) : null}

                  {order.status === "paid" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        updateStatus(
                          order.id,
                          "preparing",
                          "Commande en préparation",
                        )
                      }
                      className={cn(
                        buttonVariants({ variant: "default", size: "lg" }),
                        "col-span-2 h-11 justify-center bg-amber-500 text-black hover:bg-amber-400",
                      )}
                    >
                      Préparation
                    </button>
                  ) : null}

                  {order.status === "preparing" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        updateStatus(order.id, "shipped", "Commande expédiée")
                      }
                      className={cn(
                        buttonVariants({ variant: "default", size: "lg" }),
                        "col-span-2 h-11 justify-center bg-violet-600 text-white hover:bg-violet-600/90",
                      )}
                    >
                      Envoyé
                    </button>
                  ) : null}

                  {order.status === "shipped" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        updateStatus(order.id, "completed", "Commande terminée")
                      }
                      className={cn(
                        buttonVariants({ variant: "default", size: "lg" }),
                        "col-span-2 h-11 justify-center bg-emerald-600 text-white hover:bg-emerald-600/90",
                      )}
                    >
                      Terminé
                    </button>
                  ) : null}

                  {!["refused", "cancelled", "expired"].includes(order.status) ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        updateStatus(
                          order.id,
                          "cancelled",
                          order.status === "completed"
                            ? "Commande annulée (contre-écriture compta)"
                            : "Commande annulée",
                        )
                      }
                      className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "col-span-2 h-11 justify-center border-rose-500/35 text-rose-100 hover:bg-rose-500/10",
                      )}
                    >
                      {order.status === "completed" ? "Annuler / rembourser" : "Annuler"}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
