"use client";

import { ExternalLink, PackageSearch } from "lucide-react";

import { useClientParcelTrackingRealtime } from "@/hooks/use-client-parcel-tracking-realtime";
import {
  shopOrderDisplayTitle,
  shopOrderStatusLabelFr,
  type ShopOrder,
} from "@/lib/boutique/orders";
import { buildChronopostTrackingUrl } from "@/lib/boutique/tracking";
import { cn } from "@/lib/utils";

type ParcelTrackingLiveProps = {
  userId: string;
  initialOrders: ShopOrder[];
};

function formatShippedDate(order: ShopOrder): string | null {
  const raw = order.shipped_at ?? order.updated_at;
  if (!raw) return null;
  return new Date(raw).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ParcelTrackingLive({
  userId,
  initialOrders,
}: ParcelTrackingLiveProps) {
  const { orders } = useClientParcelTrackingRealtime(initialOrders, userId);

  if (orders.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-amber-300/18 bg-amber-500/5 px-4 py-10 text-center">
        <PackageSearch
          className="mx-auto size-8 text-amber-200/50"
          aria-hidden
        />
        <p className="mt-3 text-sm font-medium text-zinc-300">
          Aucun colis en cours.
        </p>
      </section>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {orders.map((order) => (
        <li key={order.id}>
          <ParcelTrackingCard order={order} />
        </li>
      ))}
    </ul>
  );
}

function ParcelTrackingCard({ order }: { order: ShopOrder }) {
  const tracking = order.tracking_number?.trim() ?? "";
  const shippedDate = formatShippedDate(order);

  return (
    <article className="relative overflow-hidden rounded-2xl border border-amber-200/20 bg-linear-to-br from-amber-500/8 via-zinc-950 to-black p-4 shadow-lg shadow-amber-950/15">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-amber-300/10 blur-2xl"
      />

      <div className="relative space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/75">
              Chronopost 24h
            </p>
            <h2 className="mt-1 truncate text-base font-semibold tracking-tight text-white">
              {shopOrderDisplayTitle(order)}
            </h2>
          </div>
          <span className="shrink-0 rounded-full border border-violet-400/30 bg-violet-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-100">
            {shopOrderStatusLabelFr[order.status]}
          </span>
        </div>

        <div className="grid gap-2 rounded-xl border border-white/8 bg-black/30 p-3 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-zinc-500">N° de suivi</span>
            <span className="font-mono font-semibold tabular-nums text-amber-50">
              {tracking}
            </span>
          </div>
          {shippedDate ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Expédition</span>
              <span className="font-medium text-zinc-200">{shippedDate}</span>
            </div>
          ) : null}
        </div>

        <a
          href={buildChronopostTrackingUrl(tracking)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex h-11 w-full items-center justify-center gap-2 rounded-xl",
            "bg-amber-300 text-sm font-bold text-black shadow-md shadow-amber-950/20",
            "transition active:scale-[0.99] hover:bg-amber-200",
          )}
        >
          Suivre mon colis
          <ExternalLink className="size-4" aria-hidden />
        </a>
      </div>
    </article>
  );
}
