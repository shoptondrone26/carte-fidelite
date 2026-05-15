"use client";

import type { SlotOption } from "@/lib/booking/availability";
import { cn } from "@/lib/utils";

type BookingSlotGridProps = {
  slots: SlotOption[];
  value: string | null;
  loading?: boolean;
  onChange: (startsAt: string) => void;
};

export function BookingSlotGrid({
  slots,
  value,
  loading,
  onChange,
}: BookingSlotGridProps) {
  if (loading && slots.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Chargement des créneaux…
      </p>
    );
  }

  const available = slots.filter((s) => s.available);

  if (available.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-muted-foreground">
        Aucun créneau libre ce jour-là.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {slots.map((slot) => {
        const active = value === slot.startsAt;
        return (
          <button
            key={slot.startsAt}
            type="button"
            disabled={!slot.available}
            onClick={() => onChange(slot.startsAt)}
            className={cn(
              "rounded-xl border py-2.5 text-sm font-semibold tabular-nums transition active:scale-[0.97]",
              !slot.available &&
                "cursor-not-allowed border-white/5 bg-white/[0.02] text-zinc-600 line-through",
              slot.available &&
                !active &&
                "border-white/10 bg-white/5 text-zinc-100 hover:border-amber-400/30 hover:bg-amber-500/10",
              slot.available &&
                active &&
                "border-amber-400/50 bg-amber-500/20 text-amber-50 ring-1 ring-amber-400/30",
            )}
          >
            {slot.label}
          </button>
        );
      })}
    </div>
  );
}

