"use client";

import type { AdminCalendarBooking } from "@/components/admin/admin-types";
import { badgeFor } from "@/components/admin/admin-ui";
import { parisDateLabel } from "@/lib/booking/format";
import { generateSlotStartsForDate } from "@/lib/booking/slots";
import { cn } from "@/lib/utils";

type AdminCalendarWeekProps = {
  weekKeys: string[];
  bookings: AdminCalendarBooking[];
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
};

export function AdminCalendarWeek({
  weekKeys,
  bookings,
  selectedDate,
  onSelectDate,
}: AdminCalendarWeekProps) {
  const byDay = new Map<string, AdminCalendarBooking[]>();
  for (const key of weekKeys) byDay.set(key, []);
  for (const b of bookings) {
    const key = new Date(b.starts_at).toLocaleDateString("en-CA", {
      timeZone: "Europe/Paris",
    });
    const list = byDay.get(key);
    if (list) list.push(b);
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {weekKeys.map((key) => {
        const dayBookings = byDay.get(key) ?? [];
        const pending = dayBookings.filter((b) => b.status === "pending").length;
        const active = key === selectedDate;
        const slotCount = generateSlotStartsForDate(key).length;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelectDate(key)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center transition",
              active
                ? "border-amber-400/40 bg-amber-500/15"
                : "border-border/50 bg-muted/20 hover:bg-muted/40",
            )}
          >
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">
              {parisDateLabel(key).split(" ")[0]}
            </span>
            <span className="text-xs font-bold tabular-nums">
              {key.split("-")[2]}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {dayBookings.length}/{slotCount}
            </span>
            {pending > 0 ? (
              <span
                className={cn(
                  "rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                  badgeFor("pending"),
                )}
              >
                {pending}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}


