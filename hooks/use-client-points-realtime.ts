"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchClientPointsSnapshot } from "@/lib/gifts/data";
import type { ClientPointsSnapshot } from "@/lib/gifts/types";
import { createClient } from "@/lib/supabase/client";

export function useClientPointsRealtime(
  userId: string,
  initial: ClientPointsSnapshot,
): ClientPointsSnapshot {
  const [state, setState] = useState(initial);

  useEffect(() => {
    setState(initial);
  }, [initial]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    setState(await fetchClientPointsSnapshot(supabase, userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`client:points:${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        () => void refetch(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "points_ledger", filter: `profile_id=eq.${userId}` },
        () => void refetch(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gift_requests", filter: `profile_id=eq.${userId}` },
        () => void refetch(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gift_catalog" },
        () => void refetch(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refetch, userId]);

  return state;
}

