"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { createPhantomRequestAction } from "@/actions/phantom";
import { RecentHistory } from "@/components/dashboard/recent-history";
import { ClientNotificationActivationPrompt } from "@/components/notifications/client-notification-activation-prompt";
import { useClientBookingsRealtime } from "@/hooks/use-client-bookings-realtime";
import { useClientLoyaltyRealtime } from "@/hooks/use-client-loyalty-realtime";
import { useClientPhantomRealtime } from "@/hooks/use-client-phantom-realtime";
import { formatSlotDateTime } from "@/lib/booking/format";
import {
  getFreeAvailable,
  getFreeEarned,
} from "@/lib/loyalty/free-rewards";
import {
  getCycleProgress,
  getVipLevel,
  vipLevelLabelFr,
} from "@/lib/loyalty/vip";
import {
  isActiveClientPhantomRequest,
  PHANTOM_AMOUNT_EUR,
  phantomStatusLabelFr,
  type PhantomRequest,
} from "@/lib/phantom/requests";
import {
  clientBookingStatusLabelFr,
  getVisibleClientBooking,
  hasUnlockValidatedForBooking,
  type ClientPendingBooking,
} from "@/lib/realtime/client-bookings";
import type { ClientLoyaltySnapshot } from "@/lib/realtime/client-loyalty";
import { cn } from "@/lib/utils";

type ClientHomeLiveProps = {
  userId: string;
  firstName: string;
  initial: ClientLoyaltySnapshot;
  initialBooking: ClientPendingBooking | null;
  initialPhantomRequest: PhantomRequest | null;
  initialSubscribed: boolean;
};

export function ClientHomeLive({
  userId,
  firstName,
  initial,
  initialBooking,
  initialPhantomRequest,
  initialSubscribed,
}: ClientHomeLiveProps) {
  const loyalty = useClientLoyaltyRealtime(userId, initial);
  const { pending: booking } = useClientBookingsRealtime(userId, initialBooking);
  const { phantomRequest, setPhantomRequest } = useClientPhantomRealtime(
    userId,
    initialPhantomRequest,
  );
  const [now, setNow] = useState(() => new Date());
  const [phantomPending, startPhantom] = useTransition();

  const totalUnlocks = loyalty.totalUnlocks;
  const vipLevel = getVipLevel(totalUnlocks);
  const vipLabel = vipLevelLabelFr[vipLevel];
  const cycle = getCycleProgress(totalUnlocks);
  const freeEarned = getFreeEarned(totalUnlocks);
  const freeAvailable = getFreeAvailable(freeEarned, loyalty.freeUsedCount);
  const activeBooking = getVisibleClientBooking(
    booking,
    loyalty.historyItems,
    now.getTime(),
  );
  const validatedUnlock =
    booking?.status === "accepted" &&
    hasUnlockValidatedForBooking(booking, loyalty.historyItems);
  const activePhantom = isActiveClientPhantomRequest(phantomRequest)
    ? phantomRequest
    : null;

  useEffect(() => {
    if (!activeBooking) return;
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, [activeBooking?.id, activeBooking?.starts_at]);

  function onCreatePhantom() {
    if (activePhantom) return;
    startPhantom(async () => {
      const res = await createPhantomRequestAction();
      if (res.ok) {
        if (res.request) setPhantomRequest(res.request);
        toast.success("Demande Mode Fantôme envoyée", {
          description: "ShopTonDrone va valider votre demande.",
        });
      } else {
        toast.error("Demande impossible", { description: res.error });
      }
    });
  }

  const remaining = Math.max(cycle.max - cycle.current, 0);
  const progressMessage =
    freeAvailable > 0
      ? `${freeAvailable} gratuit${freeAvailable > 1 ? "s" : ""} à utiliser`
      : cycle.justCompletedFree
        ? "Prochain gratuit à activer"
        : remaining <= 1
          ? "Encore 1 déblocage avant votre gratuit"
          : `Encore ${remaining} déblocages avant votre gratuit`;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <header className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-amber-200/75">
          ShopTonDrone Privé
        </p>
        <h1 className="truncate text-2xl font-semibold tracking-tight text-white">
          Bonjour {firstName}
        </h1>
        <p className="text-xs font-medium text-zinc-500">
          Membre VIP {vipLabel}
        </p>
      </header>

      {activeBooking ? (
        <ReservationSummary
          booking={activeBooking}
          validatedUnlock={Boolean(validatedUnlock)}
          nowMs={now.getTime()}
        />
      ) : (
        <Link
          href="/deblocage"
          className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-amber-300/35 bg-linear-to-r from-amber-300 via-amber-200 to-yellow-500 px-4 py-4 text-black shadow-lg shadow-amber-950/25 transition active:scale-[0.99]"
        >
          <span
            aria-hidden
            className="premium-sheen pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-transparent via-white/40 to-transparent"
          />
          <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-black/15 text-black">
            <CalendarDays className="size-5" aria-hidden />
          </span>
          <span className="relative min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-black/70">
              Action principale
            </span>
            <span className="mt-0.5 block truncate text-base font-bold tracking-tight">
              Réserver une place pour débloquer
            </span>
          </span>
          <ArrowRight
            className="relative size-5 shrink-0 transition group-hover:translate-x-1"
            aria-hidden
          />
        </Link>
      )}

      <Link
        href="/boutique"
        className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-4 transition active:scale-[0.99] hover:border-amber-200/20 hover:bg-white/6"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-200/20 bg-amber-200/10 text-amber-100">
          <ShoppingBag className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-tight text-white">
            Boutique privée
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-400">
            Produits réservés aux membres
          </p>
        </div>
        <ArrowRight
          className="size-4 shrink-0 text-zinc-500 transition group-hover:translate-x-1 group-hover:text-amber-200"
          aria-hidden
        />
      </Link>

      <section className="relative overflow-hidden rounded-2xl border border-amber-200/20 bg-linear-to-br from-black via-zinc-950 to-amber-950/15 p-4">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-amber-300/12 blur-3xl"
        />
        <div className="relative flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-200/20 bg-amber-300/10 text-amber-100">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-200/75">
              Service premium
            </p>
            <h3 className="mt-0.5 text-base font-semibold tracking-tight text-white">
              Mode Fantôme
            </h3>
            {activePhantom ? (
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Statut : {phantomStatusLabelFr[activePhantom.status]}.{" "}
                <Link
                  href="/dashboard"
                  className="font-semibold text-amber-200 underline-offset-2 hover:underline"
                >
                  Voir le détail
                </Link>
              </p>
            ) : (
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Service exclusif ShopTonDrone, paiement via Snapchat.
              </p>
            )}
          </div>
        </div>
        {!activePhantom ? (
          <button
            type="button"
            disabled={phantomPending}
            onClick={onCreatePhantom}
            className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-amber-300 text-sm font-bold text-black transition active:scale-[0.99] hover:bg-amber-200 disabled:opacity-50"
          >
            {phantomPending
              ? "Envoi…"
              : `Demander le Mode Fantôme — ${PHANTOM_AMOUNT_EUR}€`}
          </button>
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/70">
              Progression
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug text-white">
              {progressMessage}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Cycle
            </p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-amber-100">
              {cycle.label}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-400">
          <span>
            Déblocages :{" "}
            <span className="font-semibold tabular-nums text-white">
              {totalUnlocks}
            </span>
          </span>
          <span>
            Gratuits :{" "}
            <span className="font-semibold tabular-nums text-amber-100">
              {freeAvailable}
            </span>
            <span className="ml-1 text-[10px] text-zinc-500">
              / {freeEarned}
            </span>
          </span>
        </div>

        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/50 ring-1 ring-inset ring-white/8"
          role="progressbar"
          aria-valuenow={cycle.current}
          aria-valuemin={0}
          aria-valuemax={cycle.max}
          aria-label={`Progression fidélité : ${cycle.label}`}
        >
          <div
            className="h-full rounded-full bg-linear-to-r from-amber-700 via-amber-200 to-amber-50 shadow-[0_0_12px_rgba(251,191,36,0.28)] transition-[width] duration-700"
            style={{ width: `${cycle.percent}%` }}
          />
        </div>

        <Link
          href="/dashboard"
          className="mt-3 flex items-center justify-between text-xs font-semibold text-amber-200/85 hover:text-amber-100"
        >
          Voir mon espace privé
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </section>

      {!initialSubscribed ? (
        <ClientNotificationActivationPrompt
          initialSubscribed={initialSubscribed}
        />
      ) : null}

      <RecentHistory items={loyalty.historyItems} maxItems={3} compact />
    </div>
  );
}

function ReservationSummary({
  booking,
  validatedUnlock,
  nowMs,
}: {
  booking: ClientPendingBooking;
  validatedUnlock: boolean;
  nowMs: number;
}) {
  const statusLabel = validatedUnlock
    ? "Déblocage validé"
    : clientBookingStatusLabelFr(booking.status);
  const statusTone = validatedUnlock
    ? "border-amber-200/45 bg-linear-to-r from-emerald-400/18 to-amber-300/14 text-amber-50"
    : booking.status === "accepted"
      ? "border-emerald-300/35 bg-emerald-400/15 text-emerald-50"
      : "border-amber-300/35 bg-amber-400/15 text-amber-50";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-amber-300/22 bg-linear-to-br from-amber-500/8 via-zinc-950 to-black p-4 shadow-lg shadow-amber-950/20">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-amber-300/12 blur-2xl"
      />

      <div className="relative space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/75">
              Prochaine réservation
            </p>
            <h3 className="mt-1 truncate text-lg font-semibold tracking-tight text-white">
              {formatSlotDateTime(booking.starts_at)}
            </h3>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide",
              statusTone,
            )}
          >
            {statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-2.5 rounded-xl border border-white/8 bg-black/30 p-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-300/10 text-amber-100">
            <Clock3 className="size-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              {countdownLabel(booking.starts_at, nowMs)}
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="flex items-center justify-between text-xs font-semibold text-amber-200/85 hover:text-amber-100"
        >
          Voir le détail
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function countdownLabel(startsAt: string, nowMs: number): string {
  const diffMs = new Date(startsAt).getTime() - nowMs;
  if (diffMs <= 0) return "Rendez-vous en cours";
  const totalMinutes = Math.ceil(diffMs / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days} j ${hours} h avant le rendez-vous`;
  }
  if (hours > 0) {
    return `${hours} h ${minutes} min avant le rendez-vous`;
  }
  return `${minutes} min avant le rendez-vous`;
}
