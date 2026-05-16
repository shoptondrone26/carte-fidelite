"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

import { buildSlotOptions, type SlotOption } from "@/lib/booking/availability";
import { parisDateKey } from "@/lib/booking/format";
import { fetchOccupiedSlotStarts } from "@/lib/booking/occupied-slots";
import { createClient } from "@/lib/supabase/client";

type BookingRealtimeRow = { starts_at?: string | null };

export function useOccupiedSlots(
  dateKey: string | null,
  enabled: boolean,
  refreshToken = 0,
): { slots: SlotOption[]; loading: boolean; refetch: () => void } {
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loading, setLoading] = useState(false);
  const refetchRef = useRef<() => void>(() => undefined);

  const refetch = useCallback(async () => {
    if (!dateKey || !enabled) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const occupied = await fetchOccupiedSlotStarts(supabase, dateKey);
      setSlots(buildSlotOptions(dateKey, occupied));
    } finally {
      setLoading(false);
    }
  }, [dateKey, enabled]);

  refetchRef.current = () => {
    void refetch();
  };

  useEffect(() => {
    if (!enabled || !dateKey) {
      setSlots([]);
      return;
    }

    void refetch();
  }, [dateKey, enabled, refetch, refreshToken]);

  useEffect(() => {
    if (!enabled || !dateKey) return;

    const supabase = createClient();
    let channel: RealtimeChannel;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => refetchRef.current(), 250);
    };

    const rowAffectsDate = (row: BookingRealtimeRow | undefined) => {
      if (!row?.starts_at) return null;
      return parisDateKey(new Date(row.starts_at)) === dateKey;
    };

    const onBookingChange = (
      payload: RealtimePostgresChangesPayload<BookingRealtimeRow>,
    ) => {
      const next = payload.new as BookingRealtimeRow | undefined;
      const prev = payload.old as BookingRealtimeRow | undefined;
      const affectsNext = rowAffectsDate(next);
      const affectsPrev = rowAffectsDate(prev);
      if (affectsNext === true || affectsPrev === true) schedule();
      if (affectsNext === null && affectsPrev === null) schedule();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };

    const onOnline = () => schedule();

    channel = supabase
      .channel(`occupied-slots:${dateKey}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        onBookingChange,
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") schedule();
      });

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      void supabase.removeChannel(channel);
    };
  }, [dateKey, enabled]);

  return { slots, loading, refetch };
}
