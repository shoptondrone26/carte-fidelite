"use client";

import { pushDebugLog } from "@/lib/push-debug";
import type { OneSignalWeb } from "@/types/onesignal";

const DEFAULT_TASK_TIMEOUT_MS = 30_000;

/**
 * Exécute une fonction OneSignal (file d’attente ou instance déjà prête).
 * Évite le deadlock : si `window.OneSignal` existe, pas de second push Deferred.
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

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(
          new Error(
            "OneSignal indisponible (délai dépassé). Rechargez la page puis réessayez.",
          ),
        );
      }
    }, timeoutMs);

    const run = async (oneSignal: OneSignalWeb) => {
      try {
        const out = await fn(oneSignal);
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(out);
        }
      } catch (e) {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(e);
        }
      }
    };

    const existing = window.OneSignal;
    if (existing?.User) {
      void run(existing);
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred ?? [];
    window.OneSignalDeferred.push(run);
  });
}

type SyncFn = (id: string) => Promise<unknown>;

/**
 * Poll subscription id. Passer `existingOneSignal` si déjà dans un callback Deferred
 * (évite un second runOneSignalTask → deadlock / bouton bloqué sur « Activation… »).
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
