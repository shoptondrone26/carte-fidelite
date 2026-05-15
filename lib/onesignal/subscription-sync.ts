"use client";

import type { OneSignalWeb } from "@/types/onesignal";

/**
 * Exécute une fonction dans la file OneSignal (même ordre que init / login).
 */
export function runOneSignalTask<T>(
  fn: (OneSignal: OneSignalWeb) => Promise<T>,
): Promise<T | undefined> {
  if (typeof window === "undefined") return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    window.OneSignalDeferred = window.OneSignalDeferred ?? [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        const out = await fn(OneSignal);
        resolve(out);
      } catch (e) {
        reject(e);
      }
    });
  });
}

type SyncFn = (id: string) => Promise<unknown>;

/**
 * L’ID d’abonnement peut arriver après permission/opt-in (surtout iOS PWA).
 */
export async function pollAndSyncPushSubscription(
  sync: SyncFn,
  options?: { maxAttempts?: number; delayMs?: number },
): Promise<string | null> {
  const maxAttempts = options?.maxAttempts ?? 40;
  const delayMs = options?.delayMs ?? 200;

  const result = await runOneSignalTask(async (OneSignal) => {
    for (let i = 0; i < maxAttempts; i++) {
      const id = OneSignal.User.PushSubscription.id;
      if (id) {
        await sync(id);
        return id;
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
    return null;
  });
  return result ?? null;
}
