"use client";

import {
  setPushEnabledAction,
  syncPushSubscriptionAction,
} from "@/actions/push-preferences";
import { isOneSignalClientEnabled } from "@/lib/onesignal/config";
import {
  normalizeOneSignalClientError,
  pollAndSyncPushSubscription,
  runOneSignalTask,
} from "@/lib/onesignal/subscription-sync";
import { pushDebugLog } from "@/lib/push-debug";
import { createClient } from "@/lib/supabase/client";

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
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

async function syncSubscriptionId(
  subscriptionId: string,
): Promise<void> {
  const syncRes = await syncPushSubscriptionAction(subscriptionId);
  if (!syncRes.ok) {
    throw new Error(syncRes.error ?? "Synchronisation impossible.");
  }
}

/**
 * Activation client : APIs publiques OneSignal v16 uniquement, via OneSignalDeferred.
 */
export async function activateClientPushNotifications(): Promise<ActivateClientPushResult> {
  if (!isOneSignalClientEnabled()) {
    return { ok: false, error: "Notifications non configurées sur ce site." };
  }

  if (typeof window !== "undefined" && !window.OneSignalDeferred) {
    return {
      ok: false,
      error:
        "Le service de notifications n’est pas encore chargé. Rechargez la page.",
    };
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
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Connectez-vous pour activer les notifications.");
      }

      pushDebugLog("client activation: OneSignal.login", user.id);
      await oneSignal.login(user.id);

      pushDebugLog("client activation: requestPermission");
      await oneSignal.Notifications.requestPermission();

      const granted =
        oneSignal.Notifications.permission === true ||
        (typeof Notification !== "undefined" &&
          Notification.permission === "granted");

      if (!granted) {
        throw new Error(
          "Permission refusée. Autorisez les notifications dans les réglages du navigateur.",
        );
      }

      if (!oneSignal.User.PushSubscription.optedIn) {
        pushDebugLog("client activation: optIn");
        await oneSignal.User.PushSubscription.optIn();
      }

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
    }, 60_000);

    const enabledRes = await setPushEnabledAction(true);
    if (!enabledRes.ok) {
      return { ok: false, error: enabledRes.error ?? "Enregistrement impossible." };
    }

    return { ok: true, subscriptionId };
  } catch (e) {
    const msg = normalizeOneSignalClientError(e);
    if (msg.includes("refusée") || msg.includes("Permission")) {
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
      const optedIn = oneSignal.User.PushSubscription.optedIn === true;
      if (!id || !optedIn) return false;

      await syncSubscriptionId(id);
      const enabledRes = await setPushEnabledAction(true);
      return enabledRes.ok;
    }, 15_000);
  } catch {
    return false;
  }
}
