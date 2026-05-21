"use client";

import { pushDebugLog } from "@/lib/push-debug";
import type { OneSignalWeb } from "@/types/onesignal";

const DEFAULT_TASK_TIMEOUT_MS = 30_000;
const SDK_PRESENCE_CHECK_MS = 8_000;

export const ONESIGNAL_TIMEOUT_MSG =
  "OneSignal indisponible (délai dépassé). Rechargez la page puis réessayez.";

export const ONESIGNAL_NOT_LOADED_MSG =
  "Le service de notifications n’est pas chargé. Rechargez la page.";

/** Sérialise tous les appels SDK (évite double-login → ye.Qe). */
let oneSignalChain: Promise<unknown> = Promise.resolve();

/** Suit l’external_id déjà associé au SDK pour éviter les login() redondants. */
let linkedExternalId: string | null = null;

export function getLinkedExternalId(): string | null {
  return linkedExternalId;
}

export function setLinkedExternalId(id: string | null): void {
  linkedExternalId = id;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Détecte si le script SDK page a été ajouté au DOM.
 * Permet d’échouer vite quand l’environnement bloque le CDN (extension, CSP, mode privé).
 */
function isOneSignalScriptPresent(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.querySelector('script[src*="OneSignalSDK.page"]'),
  );
}

/**
 * Attend l’instance OneSignal en respectant l’ordre des appels (mutex global).
 * Utilise `OneSignalDeferred.push` (API publique) — le SDK v16 remplace `.push`
 * par un wrapper qui exécute immédiatement le callback une fois init() terminé.
 */
function enqueueOneSignal<T>(
  fn: (oneSignal: OneSignalWeb) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const finish = (
      result: { ok: true; value: T } | { ok: false; error: Error },
    ) => {
      if (settled) return;
      settled = true;
      if (result.ok) resolve(result.value);
      else reject(result.error);
    };

    const sdkPresent = isOneSignalScriptPresent();

    const timer = setTimeout(() => {
      finish({
        ok: false,
        error: new Error(
          sdkPresent ? ONESIGNAL_TIMEOUT_MSG : ONESIGNAL_NOT_LOADED_MSG,
        ),
      });
    }, timeoutMs);

    // Si le SDK n’a même pas été inséré dans le DOM après une fenêtre courte,
    // on échoue vite avec un message clair au lieu d’attendre le timeout long.
    void (async () => {
      if (!sdkPresent) {
        await sleep(SDK_PRESENCE_CHECK_MS);
        if (settled) return;
        if (!isOneSignalScriptPresent() && !window.OneSignalDeferred) {
          clearTimeout(timer);
          finish({
            ok: false,
            error: new Error(ONESIGNAL_NOT_LOADED_MSG),
          });
        }
      }
    })();

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

/**
 * Exécute du code OneSignal en file série (mutex global) via OneSignalDeferred.
 * N’accède jamais à window.OneSignal directement → évite les erreurs internes
 * sur des propriétés minifiées (ex. OneSignal.ye.Qe).
 */
export function runOneSignalTask<T>(
  fn: (oneSignal: OneSignalWeb) => Promise<T>,
  timeoutMs = DEFAULT_TASK_TIMEOUT_MS,
): Promise<T> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OneSignal indisponible côté serveur."));
  }

  const task = oneSignalChain.then(
    () => enqueueOneSignal(fn, timeoutMs),
    () => enqueueOneSignal(fn, timeoutMs),
  );

  // La chaîne ne doit jamais rester en rejected pour ne pas bloquer la suite.
  oneSignalChain = task.catch(() => undefined);
  return task;
}

/** true une fois qu’un callback Deferred a pu s’exécuter (SDK + init terminés). */
export function waitForOneSignalSdkReady(
  timeoutMs = 15_000,
): Promise<boolean> {
  return runOneSignalTask(async () => true, timeoutMs).catch(() => false);
}

export function normalizeOneSignalClientError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (
    /is not an object/.test(msg) ||
    /evaluating '?OneSignal\./.test(msg) ||
    /Cannot read propert/i.test(msg)
  ) {
    return "Service notifications momentanément indisponible. Rechargez la page puis réessayez.";
  }
  return msg;
}

type SyncFn = (id: string) => Promise<unknown>;

/**
 * Poll subscription id. Passer `existingOneSignal` depuis un callback Deferred en cours
 * pour éviter une nouvelle entrée dans le mutex (deadlock).
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

/** Login OneSignal idempotent : ne re-appelle pas login() si déjà associé. */
export async function ensureOneSignalLogin(
  oneSignal: OneSignalWeb,
  externalId: string,
): Promise<void> {
  if (linkedExternalId === externalId) return;
  pushDebugLog("OneSignal.login (ensure)", externalId);
  await oneSignal.login(externalId);
  linkedExternalId = externalId;
}
