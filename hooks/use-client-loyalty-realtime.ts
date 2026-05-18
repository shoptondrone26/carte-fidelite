"use client";

import { useEffect, useState } from "react";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

import {
  fetchClientLoyaltySnapshot,
  loyaltyChannelName,
  prependFreeUsedItem,
  prependHistoryItem,
  type ClientFreeUsedItem,
  type ClientHistoryItem,
  type ClientLoyaltySnapshot,
} from "@/lib/realtime/client-loyalty";
import { createClient } from "@/lib/supabase/client";

type ProfileRow = { total_unlocks?: number };
type HistoryRow = {
  id: string;
  event_type: string;
  created_at: string;
  subject_id?: string;
};

export function useClientLoyaltyRealtime(
  userId: string,
  initial: ClientLoyaltySnapshot,
): ClientLoyaltySnapshot {
  const [state, setState] = useState(initial);

  useEffect(() => {
    setState(initial);
  }, [initial]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    let channel: RealtimeChannel;
    let disposed = false;
    let timer: number | null = null;

    const refetchLatest = async () => {
      const next = await fetchClientLoyaltySnapshot(supabase, userId);
      if (!disposed) {
        setState(next);
      }
    };

    const scheduleRefetch = () => {
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(() => {
        void refetchLatest();
      }, 250);
    };

    const onProfileUpdate = (
      payload: RealtimePostgresChangesPayload<ProfileRow>,
    ) => {
      const row = payload.new as ProfileRow | undefined;
      const nextUnlocks = row?.total_unlocks;
      if (typeof nextUnlocks !== "number") return;
      setState((prev) => ({ ...prev, totalUnlocks: nextUnlocks }));
      scheduleRefetch();
    };

    const onHistoryInsert = (
      payload: RealtimePostgresChangesPayload<HistoryRow>,
    ) => {
      const row = payload.new as HistoryRow | undefined;
      if (!row?.id || !row.event_type || !row.created_at) return;

      const item: ClientHistoryItem = {
        id: row.id,
        event_type: row.event_type,
        created_at: row.created_at,
      };

      setState((prev) => {
        const historyItems = prependHistoryItem(prev.historyItems, item);
        if (row.event_type !== "free_used") {
          return { ...prev, historyItems };
        }
        const freeRow: ClientFreeUsedItem = {
          id: row.id,
          created_at: row.created_at,
        };
        return {
          ...prev,
          historyItems,
          freeUsedCount: prev.freeUsedCount + 1,
          freeUsedHistory: prependFreeUsedItem(prev.freeUsedHistory, freeRow),
        };
      });
      scheduleRefetch();
    };

    channel = supabase
      .channel(loyaltyChannelName(userId))
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        onProfileUpdate,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "history",
          filter: `subject_id=eq.${userId}`,
        },
        onHistoryInsert,
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

  return state;
}
