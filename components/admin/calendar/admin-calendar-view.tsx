"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AdminCalendarDay } from "@/components/admin/calendar/admin-calendar-day";
import { AdminCalendarWeek } from "@/components/admin/calendar/admin-calendar-week";
import type { AdminCalendarBooking } from "@/components/admin/admin-types";
import {
  calendarDayRange,
  weekDateKeys,
  weekStartKey,
} from "@/lib/admin/calendar-utils";
import { parisDateKey, parisDateLabel } from "@/lib/booking/format";
import { cn } from "@/lib/utils";

type ViewMode = "day" | "week";

type AdminCalendarViewProps = {
  bookings: AdminCalendarBooking[];
  onAction?: () => void;
};

export function AdminCalendarView({
  bookings,
  onAction,
}: AdminCalendarViewProps) {
  const [mode, setMode] = useState<ViewMode>("day");
  const [dateKey, setDateKey] = useState(() => parisDateKey(new Date()));

  const weekStart = useMemo(() => weekStartKey(dateKey), [dateKey]);
  const weekKeys = useMemo(() => weekDateKeys(weekStart), [weekStart]);

  const dayBookings = useMemo(() => {
    const { startIso, endIso } = calendarDayRange(dateKey);
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    return bookings.filter((b) => {
      const t = new Date(b.starts_at).getTime();
      return t >= start && t < end;
    });
  }, [bookings, dateKey]);

  function shiftDay(delta: number) {
    const [y, m, d] = dateKey.split("-").map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + delta, 12, 0, 0));
    setDateKey(parisDateKey(next));
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Jour précédent"
            onClick={() => shiftDay(-1)}
            className="rounded-full border border-border/60 p-2 text-muted-foreground hover:bg-muted/30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Jour suivant"
            onClick={() => shiftDay(1)}
            className="rounded-full border border-border/60 p-2 text-muted-foreground hover:bg-muted/30"
          >
            <ChevronRight className="size-4" />
          </button>
          <div>
            <p className="text-lg font-semibold capitalize">
              {parisDateLabel(dateKey)}
            </p>
            <p className="text-xs text-muted-foreground">
              Créneaux 20 min · 10h–20h
            </p>
          </div>
        </div>
        <div className="flex rounded-full border border-border/60 p-0.5">
          {(["day", "week"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setMode(v)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold capitalize",
                mode === v
                  ? "bg-amber-500/20 text-amber-50"
                  : "text-muted-foreground",
              )}
            >
              {v === "day" ? "Jour" : "Semaine"}
            </button>
          ))}
        </div>
      </div>

      {mode === "week" ? (
        <AdminCalendarWeek
          weekKeys={weekKeys}
          bookings={bookings}
          selectedDate={dateKey}
          onSelectDate={(key) => {
            setDateKey(key);
            setMode("day");
          }}
        />
      ) : null}

      {mode === "day" ? (
        <AdminCalendarDay
          dateKey={dateKey}
          bookings={dayBookings}
          onAction={onAction}
        />
      ) : null}
    </div>
  );
}

