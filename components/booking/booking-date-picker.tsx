"use client";

import { parisDateLabel } from "@/lib/booking/format";
import { cn } from "@/lib/utils";

type BookingDatePickerProps = {
  dates: string[];
  value: string | null;
  onChange: (dateKey: string) => void;
};

export function BookingDatePicker({
  dates,
  value,
  onChange,
}: BookingDatePickerProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {dates.map((key) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "shrink-0 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition active:scale-[0.97]",
              active
                ? "border-amber-400/40 bg-amber-500/15 text-amber-50 ring-1 ring-amber-400/25"
                : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
            )}
          >
            {parisDateLabel(key)}
          </button>
        );
      })}
    </div>
  );
}
