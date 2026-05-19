"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { badgeFor } from "@/components/admin/admin-ui";
import type { AdminCalendarBooking } from "@/components/admin/admin-types";
import {
  acceptBookingAction,
  refuseBookingAction,
} from "@/actions/admin-bookings";
import { buttonVariants } from "@/components/ui/button";
import { findBookingForSlot } from "@/lib/admin/calendar-utils";
import { parisDateKey, formatSlotTime } from "@/lib/booking/format";
import { generateSlotStartsForDate } from "@/lib/booking/slots";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AdminCalendarDayProps = {
  dateKey: string;
  bookings: AdminCalendarBooking[];
  onAction?: () => void;
};

export function AdminCalendarDay({
  dateKey,
  bookings,
  onAction,
}: AdminCalendarDayProps) {
  const [busy, start] = useTransition();
  const [now, setNow] = useState(() => new Date());
  const todayKey = parisDateKey(now);
  const hidePastSlots = dateKey === todayKey;
  const slots = useMemo(() => {
    const allSlots = generateSlotStartsForDate(dateKey);
    if (!hidePastSlots) return allSlots;
    return allSlots.filter((slot) => slot.getTime() >= now.getTime());
  }, [dateKey, hidePastSlots, now]);

  useEffect(() => {
    if (!hidePastSlots) return;
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, [hidePastSlots]);

  function run(
    fn: (id: string) => Promise<{ ok: boolean; error?: string }>,
    id: string,
    okMsg: string,
  ) {
    start(async () => {
      const res = await fn(id);
      if (res.ok) {
        toast.success(okMsg);
        onAction?.();
      } else {
        toast.error(res.error ?? "Erreur");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {hidePastSlots ? (
        <p className="rounded-full border border-border/50 bg-muted/10 px-3 py-1.5 text-center text-xs text-muted-foreground">
          Créneaux passés masqués
        </p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {slots.map((slot) => {
          const iso = slot.toISOString();
          const booking = findBookingForSlot(bookings, slot);

          return (
            <li
              key={iso}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-sm",
                booking
                  ? "border-amber-500/25 bg-amber-500/5"
                  : "border-border/40 bg-muted/10",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-zinc-300">
                  {formatSlotTime(iso)}
                </span>
                {!booking ? (
                  <span className="text-xs text-muted-foreground">Libre</span>
                ) : (
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {booking.profiles?.full_name?.trim() ||
                            booking.profiles?.email ||
                            "Client"}
                        </p>
                        {booking.profiles?.snap ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {booking.profiles.snap}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                          badgeFor(booking.status),
                        )}
                      >
                        {booking.status}
                      </span>
                    </div>
                    {booking.status === "pending" ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            run(
                              acceptBookingAction,
                              booking.id,
                              "Réservation acceptée",
                            )
                          }
                          className={cn(
                            buttonVariants({ variant: "default", size: "sm" }),
                            "h-9 bg-emerald-600 text-white hover:bg-emerald-600/90",
                          )}
                        >
                          Accepter
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            run(
                              refuseBookingAction,
                              booking.id,
                              "Réservation refusée",
                            )
                          }
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "h-9 border-rose-500/40 text-rose-100",
                          )}
                        >
                          Refuser
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}


