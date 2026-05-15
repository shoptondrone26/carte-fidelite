"use client";

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

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">
        Demandes à traiter
      </h2>
      {pending.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
          Aucune demande en attente.
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
                  {b.status}
                </span>
              </div>
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

