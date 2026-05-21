"use client";

import { pushDebugLog } from "@/lib/push-debug";
import type { OneSignalWeb } from "@/types/onesignal";

const DEFAULT_TASK_TIMEOUT_MS = 30_000;
export const ONESIGNAL_TIMEOUT_MSG =
  "OneSignal indisponible (délai dépassé). Rechargez la page puis réessayez.";

export const ONESIGNAL_NOT_LOADED_MSG =
  "Le service de notifications n’est pas chargé. Rechargez la page.";

/**
 * Exécute du code via la file OneSignalDeferred (instance passée par le SDK après init).
 * N’utilise jamais window.OneSignal directement — évite les erreurs internes (ex. ye.Qe).
 */
export function runOneSignalTask<T>(
  fn: (oneSignal: OneSignalWeb) => Promise<T>,
  timeoutMs = DEFAULT_TASK_TIMEOUT_MS,
): Promise<T> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OneSignal indisponible côté serveur."));
  }

  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const finish = (result: { ok: true; value: T } | { ok: false; error: Error }) => {
      if (settled) return;
      settled = true;
      if (result.ok) resolve(result.value);
      else reject(result.error);
    };

    const timer = setTimeout(() => {
      finish({ ok: false, error: new Error(ONESIGNAL_TIMEOUT_MSG) });
    }, timeoutMs);

    window.OneSignalDeferred = window.OneSignalDeferred ?? [];
    window.OneSignalDeferred.push(async (oneSignal) => {
      if (settled) return;
      try {
        const value = await fn(oneSignal);
        clearTimeout(timer);
        finish({ ok: true, value });
      } catch (e) {
        clearTimeout(timer);
        finish({
          ok: false,
          error: e instanceof Error ? e : new Error(String(e)),
        });
      }
    });
  });
}

/** true une fois qu’un callback Deferred a pu s’exécuter (SDK + init terminés). */
export function waitForOneSignalSdkReady(
  timeoutMs = 20_000,
): Promise<boolean> {
  return runOneSignalTask(async () => true, timeoutMs).catch(() => false);
}

export function normalizeOneSignalClientError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (
    msg.includes("ye.") ||
    msg.includes("is not an object") ||
    msg.includes("evaluating")
  ) {
    return "Service notifications temporairement indisponible. Rechargez la page puis réessayez.";
  }
  if (msg === ONESIGNAL_NOT_LOADED_MSG || msg === ONESIGNAL_TIMEOUT_MSG) {
    return msg;
  }
  return msg;
}

type SyncFn = (id: string) => Promise<unknown>;

/**
 * Poll subscription id. Passer `existingOneSignal` depuis un callback Deferred en cours.
 */
export async function pollAndSyncPushSubscription(
  sync: SyncFn,
  options?: { maxAttempts?: number; delayMs?: number },
  existingOneSignal?: OneSignalWeb,
): Promise<string | null> {
  const maxAttempts = options?.maxAttempts ?? 40;
  const delayMs = options?.delayMs ?? 200;

  const poll = async (oneSignal: OneSignalWeb): Promise<string | null> => {
    for (let i = 0; i < maxAttempts; i++) {
      const id = oneSignal.User.PushSubscription.id;
      if (id) {
        pushDebugLog("push subscription id obtenu (poll)", id);
        await sync(id);
        return id;
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
    pushDebugLog("poll subscription: aucun id après", maxAttempts, "tentatives");
    return null;
  };

  if (existingOneSignal) {
    return poll(existingOneSignal);
  }

  return runOneSignalTask(poll);
}
