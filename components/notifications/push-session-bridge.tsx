"use client";

import { useEffect, useRef } from "react";

import { syncPushSubscriptionAction } from "@/actions/push-preferences";
import { pushDebugLog } from "@/lib/push-debug";
import { isOneSignalClientEnabled } from "@/lib/onesignal/config";
import {
  pollAndSyncPushSubscription,
  runOneSignalTask,
} from "@/lib/onesignal/subscription-sync";
import { createClient } from "@/lib/supabase/client";

export function PushSessionBridge() {
  const linkedUserRef = useRef<string | null>(null);
  const detachSubListenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isOneSignalClientEnabled()) return;

    void runOneSignalTask(async (OneSignal) => {
      const sub = OneSignal.User.PushSubscription as unknown as {
        addEventListener?: (event: "change", fn: () => void) => void;
        removeEventListener?: (event: "change", fn: () => void) => void;
      };
      const onChange = () => {
        const id = OneSignal.User.PushSubscription.id;
        pushDebugLog("PushSubscription change, id=", id);
        if (id) void syncPushSubscriptionAction(id).then((r) => pushDebugLog("sync après change", r));
      };
      sub.addEventListener?.("change", onChange);
      detachSubListenerRef.current = () =>
        sub.removeEventListener?.("change", onChange);
    });

    const supabase = createClient();

    async function syncUser(userId: string) {
      await runOneSignalTask(async (OneSignal) => {
        if (linkedUserRef.current !== userId) {
          pushDebugLog("OneSignal.login", userId);
          await OneSignal.login(userId);
          linkedUserRef.current = userId;
        }
        const polled = await pollAndSyncPushSubscription(async (id) => {
          const r = await syncPushSubscriptionAction(id);
          pushDebugLog("sync Supabase (poll bridge)", r);
          return r;
        });
        pushDebugLog("poll subscription id (bridge)", polled);
      });
    }

    function onVisible() {
      if (document.visibilityState !== "visible") return;
      void supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          void runOneSignalTask(async () => {
            await pollAndSyncPushSubscription(
              async (id) => {
                const r = await syncPushSubscriptionAction(id);
                pushDebugLog("sync Supabase (visibility)", r);
                return r;
              },
              { maxAttempts: 15, delayMs: 200 },
            );
          });
        }
      });
    }

    document.addEventListener("visibilitychange", onVisible);

    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void syncUser(data.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        linkedUserRef.current = null;
        void runOneSignalTask(async (OneSignal) => {
          await OneSignal.logout();
        });
        return;
      }
      if (session?.user) void syncUser(session.user.id);
    });

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      subscription.unsubscribe();
      detachSubListenerRef.current?.();
      detachSubListenerRef.current = null;
    };
  }, []);

  return null;
}
