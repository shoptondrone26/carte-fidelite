"use client";

import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import type { AdminRealtimeSubscription } from "@/lib/realtime/admin-sync";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_DEBOUNCE_MS = 400;

/**
 * Debounced client-side refetch when admin-visible tables change (RLS-filtered).
 */
export function useAdminRealtimeRefetch(
  refetch: () => void | Promise<void>,
  subscriptions: AdminRealtimeSubscription[],
  debounceMs = DEFAULT_DEBOUNCE_MS,
  channelKey = "admin:refetch",
) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  const subsKey = subscriptions
    .map((s) => `${s.table}:${s.event}`)
    .join("|");

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void refetchRef.current();
      }, debounceMs);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };

    const onOnline = () => schedule();

    channel = supabase.channel(channelKey);
    for (const sub of subscriptions) {
      channel = channel.on(
        "postgres_changes",
        { event: sub.event, schema: "public", table: sub.table },
        schedule,
      );
    }
    channel.subscribe((status) => {
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
  }, [channelKey, debounceMs, subsKey]);
}
