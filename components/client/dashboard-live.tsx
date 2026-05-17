"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Clock3, Crown, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { cancelPendingBookingAction } from "@/actions/bookings";
import { FreeRewardsPanel } from "@/components/dashboard/free-rewards-panel";
import { LoyaltyCard } from "@/components/dashboard/loyalty-card";
import { RecentHistory } from "@/components/dashboard/recent-history";
import { buttonVariants } from "@/components/ui/button";
import { useClientBookingsRealtime } from "@/hooks/use-client-bookings-realtime";
import { useClientLoyaltyRealtime } from "@/hooks/use-client-loyalty-realtime";
import { formatSlotDateTime } from "@/lib/booking/format";
import {
  getFreeAvailable,
  getFreeEarned,
} from "@/lib/loyalty/free-rewards";
import {
  getCycleProgress,
  getVipLevel,
} from "@/lib/loyalty/vip";
import {
  canClientCancelBooking,
  clientBookingStatusLabelFr,
  isActiveClientBooking,
  type ClientPendingBooking,
} from "@/lib/realtime/client-bookings";
import type { ClientLoyaltySnapshot } from "@/lib/realtime/client-loyalty";
import { cn } from "@/lib/utils";

type DashboardLiveProps = {
  userId: string;
  displayName: string;
  initial: ClientLoyaltySnapshot;
  initialBooking: ClientPendingBooking | null;
};

export function DashboardLive({
  userId,
  displayName,
  initial,
  initialBooking,
}: DashboardLiveProps) {
  const loyalty = useClientLoyaltyRealtime(userId, initial);
  const { pending: booking, setPending: setBooking } = useClientBookingsRealtime(
    userId,
    initialBooking,
    {
      onAccepted: () => {
        toast.success("Réservation acceptée", {
          description: "Votre rendez-vous est confirmé.",
        });
      },
      onRefused: () => {
        toast.info("Réservation refusée", {
          description: "Vous pouvez envoyer une nouvelle demande.",
        });
      },
    },
  );
  const [now, setNow] = useState(() => new Date());
  const [cancelPending, startCancel] = useTransition();
  const totalUnlocks = loyalty.totalUnlocks;
  const vipLevel = getVipLevel(totalUnlocks);
  const cycle = getCycleProgress(totalUnlocks);
  const freeEarned = getFreeEarned(totalUnlocks);
  const freeUsed = loyalty.freeUsedCount;
  const freeAvailable = getFreeAvailable(freeEarned, freeUsed);
  const activeBooking = isActiveClientBooking(booking, now.getTime())
    ? booking
    : null;
  const hasValidatedUnlock =
    activeBooking?.status === "accepted" &&
    loyalty.historyItems.some(
      (item) =>
        item.event_type === "unlock_validated" &&
        new Date(item.created_at).getTime() >=
          new Date(activeBooking.created_at).getTime(),
    );
  const canCancel =
    activeBooking &&
    !hasValidatedUnlock &&
    canClientCancelBooking(activeBooking, now.getTime());

  useEffect(() => {
    if (!activeBooking) return;
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, [activeBooking?.id, activeBooking?.starts_at]);

  function onCancelBooking() {
    if (!booking) return;
    startCancel(async () => {
      const res = await cancelPendingBookingAction(booking.id);
      if (res.ok) {
        setBooking({ ...booking, status: "cancelled" });
        toast.success("Réservation annulée");
      } else {
        toast.error("Annulation impossible", { description: res.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-amber-300/20 bg-linear-to-br from-zinc-950 via-zinc-900 to-black p-5 shadow-xl shadow-black/40">
        <div
          aria-hidden
          className="premium-ambient pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-amber-400/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-amber-100/60 to-transparent"
        />
        <div className="relative space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
            Espace réservé aux membres ShopTonDrone Privé
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Bonjour {displayName}
          </h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            Retrouvez votre réservation en cours, votre carte fidélité et vos
            gratuits disponibles dans un espace réservé aux membres.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <span className="flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-100">
              <ShieldCheck className="size-4" aria-hidden />
              Membre actif
            </span>
            <span className="flex items-center gap-2 rounded-2xl border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-100">
              <Crown className="size-4" aria-hidden />
              Accès prioritaire activé
            </span>
          </div>
        </div>
      </section>

      <ReservationStatusCard
        booking={activeBooking}
        canCancel={Boolean(canCancel)}
        cancelPending={cancelPending}
        validatedUnlock={Boolean(hasValidatedUnlock)}
        nowMs={now.getTime()}
        onCancel={onCancelBooking}
      />

      <LoyaltyCard
        userId={userId}
        displayName={displayName}
        vipLevel={vipLevel}
        totalUnlocks={totalUnlocks}
        cycle={cycle}
        freeEarned={freeEarned}
        freeAvailable={freeAvailable}
      />
      <FreeRewardsPanel
        freeAvailable={freeAvailable}
        freeEarned={freeEarned}
        freeUsed={freeUsed}
        freeUsedHistory={loyalty.freeUsedHistory}
        cycle={cycle}
      />
      <RecentHistory items={loyalty.historyItems} />
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "h-11 w-full justify-center",
        )}
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}

function bookingMessage(
  booking: ClientPendingBooking,
  validatedUnlock: boolean,
): string {
  if (validatedUnlock) {
    return "Votre déblocage a été validé. Votre progression membre a été mise à jour.";
  }

  switch (booking.status) {
    case "pending":
      return "Votre demande est envoyée. L’équipe confirme le créneau dès que possible.";
    case "accepted":
      return "Votre rendez-vous est confirmé. Vous pouvez annuler jusqu’à 20 minutes avant l’heure prévue.";
    case "refused":
      return "Cette demande a été refusée. Vous pouvez choisir un autre créneau.";
    case "cancelled":
      return "Cette réservation a été annulée. Vous pouvez réserver un nouveau créneau.";
  }
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

function bookingTimeline(
  booking: ClientPendingBooking,
  validatedUnlock: boolean,
) {
  return [
    {
      label: "Demande envoyée",
      active: true,
      done: true,
    },
    {
      label: "Réservation acceptée",
      active: booking.status === "accepted",
      done: booking.status === "accepted",
    },
    {
      label: "Accès confirmé",
      active: booking.status === "accepted",
      done: booking.status === "accepted",
    },
    {
      label: "Déblocage validé",
      active: validatedUnlock,
      done: validatedUnlock,
    },
  ];
}

function ReservationStatusCard({
  booking,
  canCancel,
  cancelPending,
  validatedUnlock,
  nowMs,
  onCancel,
}: {
  booking: ClientPendingBooking | null;
  canCancel: boolean;
  cancelPending: boolean;
  validatedUnlock: boolean;
  nowMs: number;
  onCancel: () => void;
}) {
  if (!booking) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-dashed border-amber-300/20 bg-linear-to-br from-card/35 via-card/20 to-amber-950/10 p-5 shadow-lg shadow-black/15">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-amber-300/8 blur-3xl"
        />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-200/70">
            Accès prioritaire
          </p>
          <p className="mt-2 text-base font-semibold text-foreground">
            Aucune réservation active pour le moment.
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Réservez un nouveau créneau prioritaire quand vous êtes prêt.
          </p>
        </div>
        <Link
          href="/deblocage"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "relative mt-4 h-12 w-full justify-center shadow-lg shadow-amber-950/20",
          )}
        >
          Réserver une place
        </Link>
      </section>
    );
  }

  const blockedAcceptedCancellation =
    booking.status === "accepted" && !canCancel && !validatedUnlock;
  const statusTone =
    validatedUnlock
      ? "border-amber-200/45 bg-linear-to-r from-emerald-400/18 to-amber-300/14 text-amber-50"
      : booking.status === "accepted"
      ? "border-emerald-300/35 bg-emerald-400/15 text-emerald-50"
      : booking.status === "pending"
        ? "border-amber-300/35 bg-amber-400/15 text-amber-50"
        : booking.status === "refused"
          ? "border-rose-300/35 bg-rose-400/15 text-rose-50"
          : "border-zinc-300/20 bg-zinc-400/10 text-zinc-200";

  return (
    <section className="premium-float relative overflow-hidden rounded-3xl border border-amber-300/25 bg-linear-to-br from-amber-500/10 via-zinc-950 to-black p-5 shadow-2xl shadow-amber-950/30">
      <div
        aria-hidden
        className="premium-ambient pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-amber-300/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-amber-100/70 to-transparent"
      />
      <div
        aria-hidden
        className="premium-sheen pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-transparent via-white/10 to-transparent"
      />

      <div className="relative space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/80">
              Réservation prioritaire
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-white">
              {formatSlotDateTime(booking.starts_at)}
            </h3>
          </div>
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-[0_0_24px_rgba(245,158,11,0.12)]",
              statusTone,
            )}
          >
            {validatedUnlock
              ? "Déblocage validé"
              : clientBookingStatusLabelFr(booking.status)}
          </span>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-300/10 text-amber-100">
            <Clock3 className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              {countdownLabel(booking.starts_at, nowMs)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              {bookingMessage(booking, validatedUnlock)}
            </p>
          </div>
        </div>

        <ol className="grid grid-cols-4 gap-2">
          {bookingTimeline(booking, validatedUnlock).map((step) => (
            <li key={step.label} className="relative flex flex-col gap-2">
              <span
                className={cn(
                  "h-1 rounded-full transition-colors duration-700",
                  step.done
                    ? "bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.34)]"
                    : "bg-white/10",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-tight",
                  step.active || step.done ? "text-amber-50" : "text-zinc-500",
                )}
              >
                {step.label}
              </span>
            </li>
          ))}
        </ol>

        <p className="text-xs text-zinc-400">
          Vous pouvez annuler votre réservation jusqu’à 20 minutes avant le
          rendez-vous.
        </p>

        {blockedAcceptedCancellation ? (
          <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-100">
            Annulation impossible à moins de 20 minutes du rendez-vous.
          </p>
        ) : null}

        {canCancel && !validatedUnlock ? (
          <button
            type="button"
            disabled={cancelPending}
            onClick={onCancel}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 w-full justify-center border-destructive/40 bg-black/20 text-destructive transition duration-500 hover:bg-destructive/10 active:scale-[0.99]",
            )}
          >
            Annuler ma réservation
          </button>
        ) : null}
      </div>
    </section>
  );
}
