"use client";

import { toast } from "sonner";

import { DeblocagePanel } from "@/components/deblocage/deblocage-panel";
import { useClientBookingsRealtime } from "@/hooks/use-client-bookings-realtime";
import { useClientLoyaltyRealtime } from "@/hooks/use-client-loyalty-realtime";
import type { ClientPendingBooking } from "@/lib/realtime/client-bookings";
import type { ClientLoyaltySnapshot } from "@/lib/realtime/client-loyalty";

type DeblocageLiveProps = {
  userId: string;
  displayName: string;
  initialPending: ClientPendingBooking | null;
  initial: ClientLoyaltySnapshot;
};

export function DeblocageLive({
  userId,
  displayName,
  initialPending,
  initial,
}: DeblocageLiveProps) {
  const loyalty = useClientLoyaltyRealtime(userId, initial);
  const { pending, setPending } = useClientBookingsRealtime(
    userId,
    initialPending,
    {
      onAccepted: () => {
        toast.success("Réservation acceptée", {
          description: "Votre place a été validée par l’établissement.",
        });
      },
      onRefused: () => {
        toast.info("Réservation refusée", {
          description: "Vous pouvez envoyer une nouvelle demande.",
        });
      },
    },
  );

  return (
    <DeblocagePanel
      displayName={displayName}
      totalUnlocks={loyalty.totalUnlocks}
      freeUsedCount={loyalty.freeUsedCount}
      pending={pending}
      onPendingChange={setPending}
    />
  );
}
