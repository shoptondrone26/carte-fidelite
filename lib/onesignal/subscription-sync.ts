"use client";

import { pushDebugLog } from "@/lib/push-debug";
import type { OneSignalWeb } from "@/types/onesignal";

const DEFAULT_TASK_TIMEOUT_MS = 30_000;
const ONESIGNAL_TIMEOUT_MSG =
  "OneSignal indisponible (délai dépassé). Rechargez la page puis réessayez.";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isOneSignalReady(oneSignal: OneSignalWeb | undefined): oneSignal is OneSignalWeb {
  return Boolean(oneSignal?.User);
}

/**
 * Attend que OneSignal.init ait fini (User disponible).
 * Poll d’abord, puis file Deferred si le SDK charge encore.
 */
async function getReadyOneSignal(deadlineMs: number): Promise<OneSignalWeb> {
  while (Date.now() < deadlineMs) {
    if (isOneSignalReady(window.OneSignal)) {
      return window.OneSignal;
    }
    await sleep(80);
  }

  const remaining = Math.max(500, deadlineMs - Date.now());
  return new Promise<OneSignalWeb>((resolve, reject) => {
    let settled = false;
    const fail = () => {
      if (!settled) {
        settled = true;
        reject(new Error(ONESIGNAL_TIMEOUT_MSG));
      }
    };

    const timer = setTimeout(fail, remaining);

    const finish = (oneSignal: OneSignalWeb) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(oneSignal);
      }
    };

    if (isOneSignalReady(window.OneSignal)) {
      finish(window.OneSignal);
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred ?? [];
    window.OneSignalDeferred.push(async (oneSignal) => {
      const innerDeadline = Date.now() + remaining;
      while (Date.now() < innerDeadline) {
        if (isOneSignalReady(oneSignal)) {
          finish(oneSignal);
          return;
        }
        await sleep(80);
      }
      fail();
    });
  });
}

/** true si le SDK a terminé init (User exposé). */
export function waitForOneSignalSdkReady(
  timeoutMs = 20_000,
): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  return getReadyOneSignal(Date.now() + timeoutMs)
    .then(() => true)
    .catch(() => false);
}

/**
 * Exécute une fonction OneSignal une fois le SDK prêt (évite timeout si init en cours).
 */
export function runOneSignalTask<T>(
  fn: (oneSignal: OneSignalWeb) => Promise<T>,
  timeoutMs = DEFAULT_TASK_TIMEOUT_MS,
): Promise<T> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OneSignal indisponible côté serveur."));
  }

  const deadline = Date.now() + timeoutMs;

  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const finish = (result: { ok: true; value: T } | { ok: false; error: Error }) => {
      if (settled) return;
      settled = true;
      if (result.ok) resolve(result.value);
      else reject(result.error);
    };

    void (async () => {
      try {
        const oneSignal = await getReadyOneSignal(deadline);
        const value = await fn(oneSignal);
        finish({ ok: true, value });
      } catch (e) {
        finish({
          ok: false,
          error: e instanceof Error ? e : new Error(String(e)),
        });
      }
    })();

    setTimeout(() => {
      finish({ ok: false, error: new Error(ONESIGNAL_TIMEOUT_MSG) });
    }, timeoutMs);
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
