"use client";

import {
  setPushEnabledAction,
  syncPushSubscriptionAction,
} from "@/actions/push-preferences";
import { isOneSignalClientEnabled } from "@/lib/onesignal/config";
import {
  pollAndSyncPushSubscription,
  runOneSignalTask,
} from "@/lib/onesignal/subscription-sync";
import { pushDebugLog } from "@/lib/push-debug";

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1)
  );
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

export type ActivateClientPushResult =
  | { ok: true; subscriptionId: string | null }
  | { ok: false; error: string; needsPwaInstall?: boolean };

/**
 * Demande permission OneSignal, opt-in, sync subscription_id → profiles.
 */
export async function activateClientPushNotifications(): Promise<ActivateClientPushResult> {
  if (!isOneSignalClientEnabled()) {
    return { ok: false, error: "Notifications non configurées sur ce site." };
  }

  if (isIosDevice() && !isStandalonePwa()) {
    return {
      ok: false,
      error:
        "Ajoutez l’application à l’écran d’accueil pour activer les notifications.",
      needsPwaInstall: true,
    };
  }

  try {
    let subscriptionId: string | null = null;

    await new Promise<void>((resolve, reject) => {
      window.OneSignalDeferred = window.OneSignalDeferred ?? [];
      window.OneSignalDeferred.push(async (OneSignal) => {
        try {
          pushDebugLog("client activation: requestPermission + optIn");
          await OneSignal.Notifications.requestPermission();
          await OneSignal.User.PushSubscription.optIn();
          subscriptionId = OneSignal.User.PushSubscription.id ?? null;
          if (subscriptionId) {
            const syncRes = await syncPushSubscriptionAction(subscriptionId);
            if (!syncRes.ok) {
              reject(new Error(syncRes.error ?? "Synchronisation impossible."));
              return;
            }
          } else {
            const polled = await pollAndSyncPushSubscription(
              async (id) => {
                subscriptionId = id;
                const r = await syncPushSubscriptionAction(id);
                if (!r.ok) throw new Error(r.error ?? "sync failed");
                return r;
              },
              { maxAttempts: 60, delayMs: 300 },
            );
            if (!polled) {
              reject(
                new Error(
                  "Abonnement introuvable. Réessayez dans quelques secondes.",
                ),
              );
              return;
            }
            subscriptionId = polled;
          }
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });

    const enabledRes = await setPushEnabledAction(true);
    if (!enabledRes.ok) {
      return { ok: false, error: enabledRes.error ?? "Enregistrement impossible." };
    }

    return { ok: true, subscriptionId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("denied") || msg.includes("Permission")) {
      return {
        ok: false,
        error: "Permission refusée. Autorisez les notifications dans les réglages du navigateur.",
      };
    }
    return { ok: false, error: msg };
  }
}

/**
 * Si l’utilisateur est déjà opt-in côté OneSignal mais pas encore en base.
 */
export async function syncExistingClientPushSubscription(): Promise<boolean> {
  if (!isOneSignalClientEnabled()) return false;

  const result = await runOneSignalTask(async (OneSignal) => {
    const id = OneSignal.User.PushSubscription.id;
    const optedIn =
      typeof OneSignal.User.PushSubscription.optedIn === "boolean"
        ? OneSignal.User.PushSubscription.optedIn
        : Boolean(id);
    if (!id || !optedIn) return false;

    const syncRes = await syncPushSubscriptionAction(id);
    if (!syncRes.ok) return false;
    const enabledRes = await setPushEnabledAction(true);
    return enabledRes.ok;
  });

  return result === true;
}
