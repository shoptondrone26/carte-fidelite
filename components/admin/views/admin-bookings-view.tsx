"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  acceptBookingAction,
  refuseBookingAction,
} from "@/actions/admin-bookings";
import { badgeFor } from "@/components/admin/admin-ui";
import type { AdminBookingRow } from "@/components/admin/admin-types";
import { buttonVariants } from "@/components/ui/button";
import { formatSlotDateTime } from "@/lib/booking/format";
import { cn } from "@/lib/utils";

type AdminPendingRequestsSectionProps = {
  pending: AdminBookingRow[];
};

export function AdminPendingRequestsSection({
  pending,
}: AdminPendingRequestsSectionProps) {
  const [busy, start] = useTransition();

  function run(
    fn: (id: string) => Promise<{ ok: boolean; error?: string }>,
    id: string,
    okMsg: string,
  ) {
    start(async () => {
      const res = await fn(id);
      if (res.ok) {
        toast.success(okMsg);
      } else {
        toast.error(res.error ?? "Erreur");
      }
    });
  }

  function statusLabel(status: string) {
    switch (status) {
      case "pending":
        return "En attente";
      case "accepted":
        return "Acceptée";
      default:
        return status;
    }
  }

  function slotRelativeLabel(startsAt: string): string {
    const starts = new Date(startsAt);
    const now = new Date();
    const diffMinutes = Math.round((starts.getTime() - now.getTime()) / 60_000);
    const sameDay =
      starts.getFullYear() === now.getFullYear() &&
      starts.getMonth() === now.getMonth() &&
      starts.getDate() === now.getDate();

    if (diffMinutes < 0) {
      return `En retard de ${Math.abs(diffMinutes)} min`;
    }
    if (diffMinutes < 60) {
      return `Dans ${diffMinutes} min`;
    }
    if (diffMinutes < 120) {
      return "Dans 1h";
    }
    if (sameDay) {
      return `Aujourd’hui à ${starts.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    return starts.toLocaleString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">
        Demandes à traiter
      </h2>
      {pending.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
          Aucune demande ou réservation à venir.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {pending.map((b) => (
            <li
              key={b.id}
              className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/40 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {b.profiles?.full_name?.trim() ||
                      b.profiles?.email ||
                      "Client"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Créneau : {formatSlotDateTime(b.starts_at)}
                  </p>
                  <p className="mt-1 inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-100">
                    {slotRelativeLabel(b.starts_at)}
                  </p>
                  {b.profiles?.snap ? (
                    <p className="text-xs text-muted-foreground">
                      {b.profiles.snap}
                    </p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                    badgeFor(b.status),
                  )}
                >
                  {statusLabel(b.status)}
                </span>
              </div>
              {b.status === "pending" ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(
                        acceptBookingAction,
                        b.id,
                        "Réservation acceptée — place validée",
                      )
                    }
                    className={cn(
                      buttonVariants({ variant: "default", size: "lg" }),
                      "h-12 w-full justify-center bg-emerald-600 text-white hover:bg-emerald-600/90",
                    )}
                  >
                    Accepter
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(refuseBookingAction, b.id, "Réservation refusée")
                    }
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "h-12 w-full justify-center border-rose-500/40 text-rose-100 hover:bg-rose-500/10",
                    )}
                  >
                    Refuser
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-xs text-emerald-100/90">
                    Rendez-vous accepté à venir. Validez le déblocage depuis la
                    carte client après le passage.
                  </p>
                  <Link
                    href={`/admin/clients?client=${b.profile_id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "h-12 w-full justify-center border-emerald-500/35 text-emerald-100 hover:bg-emerald-500/10",
                    )}
                  >
                    Voir carte client
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type AdminRecentDecisionsSectionProps = {
  recent: AdminBookingRow[];
};

export function AdminRecentDecisionsSection({
  recent,
}: AdminRecentDecisionsSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">
        Dernières décisions
      </h2>
      <ul className="flex flex-col gap-2">
        {recent.length === 0 ? (
          <li className="text-sm text-muted-foreground">Aucun historique.</li>
        ) : (
          recent.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5 text-sm"
            >
              <span className="truncate">
                {b.profiles?.full_name || b.profiles?.email || "—"}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                  badgeFor(b.status),
                )}
              >
                {b.status}
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

type AdminBookingsViewProps = {
  pending: AdminBookingRow[];
  recent: AdminBookingRow[];
};

/** Liste complète (pending + recent) — ex. admin-bookings-live */
export function AdminBookingsView({ pending, recent }: AdminBookingsViewProps) {
  return (
    <div className="flex flex-col gap-10 pb-4">
      <AdminPendingRequestsSection pending={pending} />
      <AdminRecentDecisionsSection recent={recent} />
    </div>
  );
}

