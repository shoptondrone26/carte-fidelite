"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
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
  const canCancel =
    booking && canClientCancelBooking(booking, now.getTime());

  useEffect(() => {
    if (booking?.status !== "accepted") return;
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, [booking?.status, booking?.starts_at]);

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
          className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-amber-400/15 blur-3xl"
        />
        <div className="relative space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
            Espace privé membre
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Bonjour {displayName}
          </h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            Retrouvez votre réservation en cours, votre carte fidélité et vos
            gratuits disponibles dans un espace réservé aux membres.
          </p>
        </div>
      </section>

      <ReservationStatusCard
        booking={booking}
        canCancel={Boolean(canCancel)}
        cancelPending={cancelPending}
        onCancel={onCancelBooking}
      />

      <LoyaltyCard
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

function bookingMessage(booking: ClientPendingBooking): string {
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

function ReservationStatusCard({
  booking,
  canCancel,
  cancelPending,
  onCancel,
}: {
  booking: ClientPendingBooking | null;
  canCancel: boolean;
  cancelPending: boolean;
  onCancel: () => void;
}) {
  if (!booking) {
    return (
      <section className="rounded-2xl border border-dashed border-white/10 bg-card/25 p-5">
        <p className="text-sm font-semibold text-foreground">
          Aucune réservation en cours
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Réservez un créneau de déblocage depuis votre espace membre.
        </p>
        <Link
          href="/deblocage"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "mt-4 h-12 w-full justify-center",
          )}
        >
          Réserver une place
        </Link>
      </section>
    );
  }

  const blockedAcceptedCancellation =
    booking.status === "accepted" && !canCancel;

  return (
    <section className="space-y-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/80">
            Réservation en cours
          </p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            {formatSlotDateTime(booking.starts_at)}
          </h3>
        </div>
        <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-100">
          {clientBookingStatusLabelFr(booking.status)}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {bookingMessage(booking)}
      </p>

      <p className="text-xs text-muted-foreground">
        Vous pouvez annuler votre réservation jusqu’à 20 minutes avant le
        rendez-vous.
      </p>

      {blockedAcceptedCancellation ? (
        <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-100">
          Annulation impossible à moins de 20 minutes du rendez-vous.
        </p>
      ) : null}

      {canCancel ? (
        <button
          type="button"
          disabled={cancelPending}
          onClick={onCancel}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-12 w-full justify-center border-destructive/40 text-destructive hover:bg-destructive/10",
          )}
        >
          Annuler ma réservation
        </button>
      ) : null}
    </section>
  );
}
