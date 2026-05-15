"use client";

import { useCallback, useEffect, useState } from "react";

import { buildSlotOptions, type SlotOption } from "@/lib/booking/availability";
import { fetchOccupiedSlotStarts } from "@/lib/booking/occupied-slots";
import { createClient } from "@/lib/supabase/client";

const POLL_MS = 12_000;

export function useOccupiedSlots(
  dateKey: string | null,
  enabled: boolean,
  refreshToken = 0,
): { slots: SlotOption[]; loading: boolean; refetch: () => void } {
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (!enabled || !dateKey) {
      setSlots([]);
      return;
    }

    void refetch();
    const id = setInterval(() => void refetch(), POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") void refetch();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [dateKey, enabled, refetch, refreshToken]);

  return { slots, loading, refetch };
}
