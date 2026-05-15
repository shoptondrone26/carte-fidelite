"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { cancelPendingBookingAction } from "@/actions/bookings";
import { BookingFlow } from "@/components/booking/booking-flow";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getFreeAvailable,
  getFreeEarned,
} from "@/lib/loyalty/free-rewards";
import {
  getCycleProgress,
  getStampsUntilNextFree,
  getVipLevel,
  vipLevelLabelFr,
} from "@/lib/loyalty/vip";
import { formatSlotDateTime } from "@/lib/booking/format";

import type { ClientPendingBooking } from "@/lib/realtime/client-bookings";

type DeblocagePanelProps = {
  displayName: string;
  totalUnlocks: number;
  freeUsedCount: number;
  pending: ClientPendingBooking | null;
  onPendingChange?: React.Dispatch<
    React.SetStateAction<ClientPendingBooking | null>
  >;
};

export function DeblocagePanel({
  displayName,
  totalUnlocks,
  freeUsedCount,
  pending,
  onPendingChange,
}: DeblocagePanelProps) {
  const [showFlow, setShowFlow] = useState(false);
  const [slotsRefresh, setSlotsRefresh] = useState(0);
  const [pendingUi, startTransition] = useTransition();
  const vip = getVipLevel(totalUnlocks);
  const cycle = getCycleProgress(totalUnlocks);
  const freeEarned = getFreeEarned(totalUnlocks);
  const freeAvailable = getFreeAvailable(freeEarned, freeUsedCount);
  const untilFree = getStampsUntilNextFree(totalUnlocks);

  async function onCancel(id: string) {
    startTransition(async () => {
      const res = await cancelPendingBookingAction(id);
      if (res.ok) {
        onPendingChange?.(null);
        setSlotsRefresh((n) => n + 1);
        toast.success("Demande annulée");
      } else {
        toast.error("Annulation impossible", { description: res.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/90 via-zinc-900 to-zinc-950 p-6 shadow-xl shadow-black/40">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full bg-amber-400/15 blur-3xl"
        />
        <div className="relative space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-400">
            Résumé fidélité
          </p>
          <p className="text-2xl font-semibold tracking-tight text-white">
            {displayName}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-zinc-100">
              VIP {vipLevelLabelFr[vip]}
            </span>
            <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100">
              {totalUnlocks} déblocages cumulés
            </span>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-100">
              {freeAvailable} gratuit{freeAvailable !== 1 ? "s" : ""} à utiliser
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Cycle actuel</span>
              <span className="tabular-nums text-zinc-100">{cycle.label}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/40 ring-1 ring-inset ring-white/10">
              <div
                className="h-full rounded-full bg-linear-to-r from-amber-500 via-amber-300 to-amber-400 transition-all duration-500"
                style={{ width: `${cycle.percent}%` }}
              />
            </div>
          </div>
          {cycle.justCompletedFree ? (
            <p className="text-sm font-medium text-emerald-300/90">
              Cycle complété — votre gratuit est débloqué. Prochain cycle : 0/3.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-zinc-300">
              Encore{" "}
              <span className="font-semibold text-white">{untilFree}</span>{" "}
              tampon{untilFree > 1 ? "s" : ""} avant le prochain gratuit (cycle
              de 3).
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        {pending ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-amber-50">
                Réservation en attente
              </p>
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-100">
                En cours
              </span>
            </div>
            <p className="text-sm text-zinc-200">
              Créneau :{" "}
              <span className="font-medium text-amber-50">
                {formatSlotDateTime(pending.starts_at)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Demandée le{" "}
              {new Date(pending.created_at).toLocaleString("fr-FR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <button
              type="button"
              disabled={pendingUi}
              onClick={() => onCancel(pending.id)}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 w-full justify-center border-destructive/40 text-destructive hover:bg-destructive/10",
              )}
            >
              Annuler la demande
            </button>
          </div>
        ) : showFlow ? (
          <BookingFlow
            key={slotsRefresh}
            onBooked={(booking) => {
              onPendingChange?.(booking);
              setShowFlow(false);
            }}
            onCancel={() => setShowFlow(false)}
          />
        ) : (
          <button
            type="button"
            disabled={pendingUi}
            onClick={() => setShowFlow(true)}
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "h-14 w-full justify-center text-base shadow-lg shadow-amber-900/25",
            )}
          >
            Réserver une place
          </button>
        )}
      </section>

      <Link
        href="/dashboard"
        className={cn(
          buttonVariants({ variant: "secondary", size: "lg" }),
          "h-12 w-full justify-center",
        )}
      >
        Tableau de bord
      </Link>
    </div>
  );
}

