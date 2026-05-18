"use client";

import { useEffect, useRef, useState } from "react";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

import {
  bookingsChannelName,
  fetchClientBookingSnapshot,
  pendingFromBookingRow,
  type BookingRealtimeRow,
  type ClientPendingBooking,
} from "@/lib/realtime/client-bookings";
import { createClient } from "@/lib/supabase/client";

type UseClientBookingsRealtimeOptions = {
  onAccepted?: () => void;
  onRefused?: () => void;
  onCancelled?: () => void;
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
    let disposed = false;
    let timer: number | null = null;

    const notifyStatusChange = (
      prev: ClientPendingBooking | null,
      next: ClientPendingBooking | null,
    ) => {
      if (!prev || !next || prev.id !== next.id || prev.status === next.status) {
        return;
      }
      if (next.status === "accepted") {
        optionsRef.current?.onAccepted?.();
      }
      if (next.status === "refused") {
        optionsRef.current?.onRefused?.();
      }
      if (next.status === "cancelled") {
        optionsRef.current?.onCancelled?.();
      }
    };

    const applyNext = (next: ClientPendingBooking | null) => {
      setPending((prev) => {
        notifyStatusChange(prev, next);
        return next;
      });
    };

    const refetchLatest = async () => {
      const next = await fetchClientBookingSnapshot(supabase, userId);
      if (!disposed) {
        applyNext(next);
      }
    };

    const scheduleRefetch = () => {
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(() => {
        void refetchLatest();
      }, 250);
    };

    const handleRow = (row: BookingRealtimeRow | undefined) => {
      if (!row?.id) return;
      applyNext(pendingFromBookingRow(row));
      scheduleRefetch();
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
      .subscribe((status) => {
        if (status === "SUBSCRIBED") scheduleRefetch();
      });

    const onVisible = () => {
      if (document.visibilityState === "visible") scheduleRefetch();
    };
    const onOnline = () => scheduleRefetch();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return { pending, setPending };
}
