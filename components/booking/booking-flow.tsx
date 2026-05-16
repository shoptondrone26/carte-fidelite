"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { createPendingBookingAction } from "@/actions/bookings";
import { BookingDatePicker } from "@/components/booking/booking-date-picker";
import { BookingSlotGrid } from "@/components/booking/booking-slot-grid";
import { buttonVariants } from "@/components/ui/button";
import { useOccupiedSlots } from "@/hooks/use-occupied-slots";
import { formatSlotDate, formatSlotTime } from "@/lib/booking/format";
import { getBookableDateKeys } from "@/lib/booking/slots";
import type { ClientPendingBooking } from "@/lib/realtime/client-bookings";
import { cn } from "@/lib/utils";

type BookingFlowProps = {
  onBooked: (booking: ClientPendingBooking) => void;
  onCancel: () => void;
};

export function BookingFlow({ onBooked, onCancel }: BookingFlowProps) {
  const dates = useMemo(() => getBookableDateKeys(), []);
  const [dateKey, setDateKey] = useState<string | null>(dates[0] ?? null);
  const [slotStart, setSlotStart] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [pendingUi, startTransition] = useTransition();

  const { slots, loading } = useOccupiedSlots(dateKey, Boolean(dateKey), refreshToken);

  function onConfirm() {
    if (!slotStart) return;
    startTransition(async () => {
      const res = await createPendingBookingAction(slotStart);
      if (!res.ok) {
        setRefreshToken((n) => n + 1);
        toast.error("Impossible de réserver", { description: res.error });
        return;
      }
      if (res.booking) {
        onBooked({
          id: res.booking.id,
          created_at: res.booking.created_at,
          starts_at: res.booking.starts_at,
        });
        toast.success("Réservation envoyée", {
          description: `${formatSlotDate(res.booking.starts_at)} · ${formatSlotTime(res.booking.starts_at)}`,
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-zinc-900/60 p-5 animate-in fade-in duration-300">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">Choisir une date</p>
        <p className="text-xs text-muted-foreground">
          Créneaux de 20 minutes · 10h–00h
        </p>
      </div>
      <BookingDatePicker
        dates={dates}
        value={dateKey}
        onChange={(key) => {
          setDateKey(key);
          setSlotStart(null);
        }}
      />

      <div className="space-y-2">
        <p className="text-sm font-semibold text-white">Heure</p>
        <BookingSlotGrid
          slots={slots}
          value={slotStart}
          loading={loading}
          onChange={setSlotStart}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          disabled={pendingUi}
          onClick={onCancel}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-12 w-full justify-center",
          )}
        >
          Annuler
        </button>
        <button
          type="button"
          disabled={pendingUi || !slotStart}
          onClick={onConfirm}
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "h-12 w-full justify-center",
          )}
        >
          Confirmer
        </button>
      </div>
    </div>
  );
}

