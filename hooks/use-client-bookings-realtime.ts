"use client";

import { useEffect, useRef, useState } from "react";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

import {
  bookingsChannelName,
  pendingFromBookingRow,
  type BookingRealtimeRow,
  type ClientPendingBooking,
} from "@/lib/realtime/client-bookings";
import { createClient } from "@/lib/supabase/client";

type UseClientBookingsRealtimeOptions = {
  onAccepted?: () => void;
  onRefused?: () => void;
};

export function useClientBookingsRealtime(
  userId: string,
  initialPending: ClientPendingBooking | null,
  options?: UseClientBookingsRealtimeOptions,
): {
  pending: ClientPendingBooking | null;
  setPending: React.Dispatch<
    React.SetStateAction<ClientPendingBooking | null>
  >;
} {
  const [pending, setPending] = useState(initialPending);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    setPending(initialPending);
  }, [initialPending]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    let channel: RealtimeChannel;

    const handleRow = (row: BookingRealtimeRow | undefined) => {
      if (!row?.id) return;
      setPending((prev) => {
        const wasTracked = prev?.id === row.id;
        const next = pendingFromBookingRow(row);
        if (wasTracked && row.status === "accepted") {
          optionsRef.current?.onAccepted?.();
        }
        if (wasTracked && row.status === "refused") {
          optionsRef.current?.onRefused?.();
        }
        return next;
      });
    };

    const onInsert = (
      payload: RealtimePostgresChangesPayload<BookingRealtimeRow>,
    ) => {
      handleRow(payload.new as BookingRealtimeRow | undefined);
    };

    const onUpdate = (
      payload: RealtimePostgresChangesPayload<BookingRealtimeRow>,
    ) => {
      handleRow(payload.new as BookingRealtimeRow | undefined);
    };

    channel = supabase
      .channel(bookingsChannelName(userId))
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookings",
          filter: `profile_id=eq.${userId}`,
        },
        onInsert,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `profile_id=eq.${userId}`,
        },
        onUpdate,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return { pending, setPending };
}
