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
  return /iPad|iPhone|iPod/i.test(navigator.userAgent);
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

async function syncSubscriptionId(
  subscriptionId: string,
): Promise<void> {
  const syncRes = await syncPushSubscriptionAction(subscriptionId);
  if (!syncRes.ok) {
    throw new Error(syncRes.error ?? "Synchronisation impossible.");
  }
}

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
    const subscriptionId = await runOneSignalTask(async (oneSignal) => {
      pushDebugLog("client activation: requestPermission + optIn");
      await oneSignal.Notifications.requestPermission();
      await oneSignal.User.PushSubscription.optIn();

      let id = oneSignal.User.PushSubscription.id ?? null;
      if (id) {
        await syncSubscriptionId(id);
        return id;
      }

      const polled = await pollAndSyncPushSubscription(
        async (nextId) => {
          await syncSubscriptionId(nextId);
          return { ok: true };
        },
        { maxAttempts: 60, delayMs: 300 },
        oneSignal,
      );

      if (!polled) {
        throw new Error(
          "Abonnement introuvable. Réessayez dans quelques secondes.",
        );
      }

      return polled;
    }, 45_000);

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
        error:
          "Permission refusée. Autorisez les notifications dans les réglages du navigateur.",
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

  try {
    return await runOneSignalTask(async (oneSignal) => {
      const id = oneSignal.User.PushSubscription.id;
      const optedIn =
        typeof oneSignal.User.PushSubscription.optedIn === "boolean"
          ? oneSignal.User.PushSubscription.optedIn
          : Boolean(id);
      if (!id || !optedIn) return false;

      await syncSubscriptionId(id);
      const enabledRes = await setPushEnabledAction(true);
      return enabledRes.ok;
    }, 12_000);
  } catch {
    return false;
  }
}
