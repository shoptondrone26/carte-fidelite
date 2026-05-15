"use client";

import { useEffect, useRef } from "react";

import { syncPushSubscriptionAction } from "@/actions/push-preferences";
import { isOneSignalClientEnabled } from "@/lib/onesignal/config";
import { createClient } from "@/lib/supabase/client";

function runWhenReady(fn: (os: NonNullable<Window["OneSignal"]>) => void) {
  if (typeof window === "undefined") return;
  window.OneSignalDeferred = window.OneSignalDeferred ?? [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    fn(OneSignal);
  });
}

export function PushSessionBridge() {
  const linkedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOneSignalClientEnabled()) return;

    const supabase = createClient();

    const linkUser = async (userId: string) => {
      if (linkedRef.current === userId) return;
      runWhenReady(async (OneSignal) => {
        await OneSignal.login(userId);
        linkedRef.current = userId;
        const subId = OneSignal.User.PushSubscription.id;
        if (subId) {
          await syncPushSubscriptionAction(subId);
        }
      });
    };

    const unlinkUser = () => {
      linkedRef.current = null;
      runWhenReady(async (OneSignal) => {
        await OneSignal.logout();
      });
    };

    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void linkUser(data.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        unlinkUser();
        return;
      }
      if (session?.user) void linkUser(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
