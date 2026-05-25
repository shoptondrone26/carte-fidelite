"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  CheckCircle2,
  ExternalLink,
  History,
  Package,
  PackageSearch,
} from "lucide-react";
import { toast } from "sonner";

import { adminUpdateShopOrderStatusAction } from "@/actions/shop-orders";
import { useAdminRealtimeRefetch } from "@/hooks/use-admin-realtime-refetch";
import { buildChronopostTrackingUrl } from "@/lib/boutique/tracking";
import {
  fetchAdminTrackableShopOrders,
  shopOrderLineItems,
  shopOrderStatusLabelFr,
  type AdminShopOrder,
  type ShopOrderStatus,
} from "@/lib/boutique/orders";
import { formatShopPrice } from "@/lib/boutique/products";
import { ADMIN_TRACKING_SYNC } from "@/lib/realtime/admin-sync";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AdminTrackingLiveProps = {
  initialActive: AdminShopOrder[];
  initialHistory: AdminShopOrder[];
};

function statusBadge(status: ShopOrderStatus): string {
  switch (status) {
    case "paid":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
    case "preparing":
      return "border-amber-400/30 bg-amber-400/10 text-amber-100";
    case "shipped":
      return "border-violet-400/30 bg-violet-400/10 text-violet-100";
    case "completed":
      return "border-emerald-300/40 bg-emerald-300/15 text-emerald-50";
    case "cancelled":
      return "border-rose-400/30 bg-rose-400/10 text-rose-100";
    default:
      return "border-white/20 bg-white/5 text-zinc-300";
  }
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TrackingCard({
  order,
  onComplete,
  busy,
}: {
  order: AdminShopOrder;
  onComplete: (orderId: string) => void;
  busy: boolean;
}) {
  const profile = order.profiles;
  const lines = shopOrderLineItems(order);
  const trackingUrl = order.tracking_number
    ? buildChronopostTrackingUrl(order.tracking_number)
    : null;

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-amber-200/15 bg-linear-to-br from-amber-500/10 via-card/35 to-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">
            {profile?.full_name?.trim() || profile?.email || "Client"}
          </p>
          {profile?.snap ? (
            <p className="text-xs text-amber-100/80">{profile.snap}</p>
          ) : null}
          {profile?.email ? (
            <p className="text-xs text-muted-foreground">{profile.email}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            statusBadge(order.status),
          )}
        >
          {shopOrderStatusLabelFr[order.status]}
        </span>
      </div>

      <ul className="space-y-1">
        {lines.map((line) => (
          <li
            key={line.id}
            className="flex items-baseline justify-between gap-2 text-sm"
          >
            <span className="min-w-0 text-white">
              {line.product_name}
              {line.quantity > 1 ? (
                <span className="text-zinc-400"> × {line.quantity}</span>
              ) : null}
            </span>
            <span className="shrink-0 tabular-nums text-amber-100/90">
              {formatShopPrice(line.line_total_eur)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold text-amber-100">Total</span>
        <span className="font-bold tabular-nums text-amber-50">
          {formatShopPrice(order.total_price_eur)}
        </span>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <Package className="size-3.5 text-violet-300" aria-hidden />
          <span className="font-mono text-violet-200">
            {order.tracking_number}
          </span>
        </p>
        {order.shipped_at ? (
          <p>Expédié le {formatDate(order.shipped_at)}</p>
        ) : null}
        <p>Commandé le {formatDate(order.created_at)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {trackingUrl ? (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition",
              "bg-violet-600 text-white hover:bg-violet-500",
            )}
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Suivre le colis
          </a>
        ) : null}

        {order.status === "shipped" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onComplete(order.id)}
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition",
              "bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40",
            )}
          >
            <CheckCircle2 className="size-3.5" aria-hidden />
            Marquer livré
          </button>
        ) : null}
      </div>
    </li>
  );
}

function HistoryRow({ order }: { order: AdminShopOrder }) {
  const profile = order.profiles;

  return (
    <li className="flex items-center gap-3 px-4 py-2.5 first:rounded-t-2xl last:rounded-b-2xl">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {profile?.full_name?.trim() || profile?.email || "Client"}
        </p>
        <p className="truncate font-mono text-xs text-violet-200/80">
          {order.tracking_number}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
          statusBadge(order.status),
        )}
      >
        {shopOrderStatusLabelFr[order.status]}
      </span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {formatDateShort(
          order.completed_at ?? order.cancelled_at ?? order.created_at,
        )}
      </span>
    </li>
  );
}

export function AdminTrackingLive({
  initialActive,
  initialHistory,
}: AdminTrackingLiveProps) {
  const [active, setActive] = useState(initialActive);
  const [history, setHistory] = useState(initialHistory);
  const [busy, startTransition] = useTransition();

  useEffect(() => {
    setActive(initialActive);
    setHistory(initialHistory);
  }, [initialActive, initialHistory]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const result = await fetchAdminTrackableShopOrders(supabase);
    setActive(result.active);
    setHistory(result.history);
  }, []);

  useAdminRealtimeRefetch(refetch, ADMIN_TRACKING_SYNC, 400, "admin:tracking");

  function markCompleted(orderId: string) {
    startTransition(async () => {
      const res = await adminUpdateShopOrderStatusAction(
        orderId,
        "completed",
      );
      if (res.ok) {
        toast.success("Commande marquée comme livrée");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Active parcels */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/75">
              Chronopost
            </p>
            <h2 className="text-lg font-semibold tracking-tight">
              Colis en cours
            </h2>
          </div>
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
            {active.length}
          </span>
        </div>

        {active.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center">
            <PackageSearch className="size-8 text-muted-foreground/50" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Aucun colis en cours de livraison.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {active.map((order) => (
              <TrackingCard
                key={order.id}
                order={order}
                onComplete={markCompleted}
                busy={busy}
              />
            ))}
          </ul>
        )}
      </section>

      {/* History */}
      {history.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" aria-hidden />
            <h2 className="text-sm font-semibold text-muted-foreground">
              Historique des colis
            </h2>
          </div>
          <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card/30">
            {history.map((order) => (
              <HistoryRow key={order.id} order={order} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
