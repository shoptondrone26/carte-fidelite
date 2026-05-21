"use client";

import { useEffect } from "react";

import { syncPushSubscriptionAction } from "@/actions/push-preferences";
import { pushDebugLog } from "@/lib/push-debug";
import { isOneSignalClientEnabled } from "@/lib/onesignal/config";
import {
  ensureOneSignalLogin,
  runOneSignalTask,
  setLinkedExternalId,
} from "@/lib/onesignal/subscription-sync";
import { createClient } from "@/lib/supabase/client";

/**
 * Maintient l’association user Supabase ↔ OneSignal (login/logout) et persiste
 * l’éventuel subscription_id existant. Toutes les opérations passent par le mutex
 * global `runOneSignalTask`, ce qui évite les courses avec l’activation manuelle.
 */
export function PushSessionBridge() {
  useEffect(() => {
    if (!isOneSignalClientEnabled()) return;

    let detachChange: (() => void) | null = null;
    let cancelled = false;

    void runOneSignalTask(async (OneSignal) => {
      if (cancelled) return;
      const sub = OneSignal.User.PushSubscription as unknown as {
        addEventListener?: (event: "change", fn: () => void) => void;
        removeEventListener?: (event: "change", fn: () => void) => void;
      };
      const onChange = () => {
        const id = OneSignal.User.PushSubscription.id;
        pushDebugLog("PushSubscription change, id=", id);
        if (id) {
          void syncPushSubscriptionAction(id).then((r) =>
            pushDebugLog("sync après change", r),
          );
        }
      };
      sub.addEventListener?.("change", onChange);
      detachChange = () => sub.removeEventListener?.("change", onChange);
    }).catch(() => {
      /* SDK pas dispo : pas grave, l’activation manuelle gérera */
    });

    const supabase = createClient();

    async function loginIfPresent(userId: string) {
      try {
        await runOneSignalTask(async (OneSignal) => {
          await ensureOneSignalLogin(OneSignal, userId);
          // Sync immédiate si un id est déjà disponible (utilisateur déjà opt-in)
          const existingId = OneSignal.User.PushSubscription.id;
          if (existingId) {
            const r = await syncPushSubscriptionAction(existingId);
            pushDebugLog("sync immédiate (bridge)", r);
          }
        });
      } catch (e) {
        pushDebugLog("bridge login erreur", e);
      }
    }

    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (data.user) void loginIfPresent(data.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setLinkedExternalId(null);
        void runOneSignalTask(async (OneSignal) => {
          await OneSignal.logout();
        }).catch(() => undefined);
        return;
      }
      if (session?.user) void loginIfPresent(session.user.id);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      detachChange?.();
      detachChange = null;
    };
  }, []);

  return null;
}
