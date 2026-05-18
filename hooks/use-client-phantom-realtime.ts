"use client";

import { useEffect, useState } from "react";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

import {
  fetchClientPhantomRequest,
  phantomRequestsChannelName,
  type PhantomRequest,
} from "@/lib/phantom/requests";
import { createClient } from "@/lib/supabase/client";

export function useClientPhantomRealtime(
  userId: string,
  initial: PhantomRequest | null,
): {
  phantomRequest: PhantomRequest | null;
  setPhantomRequest: React.Dispatch<React.SetStateAction<PhantomRequest | null>>;
} {
  const [phantomRequest, setPhantomRequest] = useState(initial);

  useEffect(() => {
    setPhantomRequest(initial);
  }, [initial]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    let channel: RealtimeChannel;
    let disposed = false;
    let timer: number | null = null;

    const refetchLatest = async () => {
      const next = await fetchClientPhantomRequest(supabase, userId);
      if (!disposed) {
        setPhantomRequest(next);
      }
    };

    const scheduleRefetch = () => {
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(() => {
        void refetchLatest();
      }, 250);
    };

    const onChange = (
      payload: RealtimePostgresChangesPayload<PhantomRequest>,
    ) => {
      const row = payload.new as PhantomRequest | undefined;
      if (row?.id) {
        setPhantomRequest(row);
      }
      scheduleRefetch();
    };

    channel = supabase
      .channel(phantomRequestsChannelName(userId))
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "phantom_requests",
          filter: `profile_id=eq.${userId}`,
        },
        onChange,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "phantom_requests",
          filter: `profile_id=eq.${userId}`,
        },
        onChange,
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

  return { phantomRequest, setPhantomRequest };
}
