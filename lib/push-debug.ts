"use client";

/**
 * Diagnostic push : UI + logs sans exposer de secrets.
 * En production, seul NEXT_PUBLIC_PUSH_DEBUG=1 peut l'activer au déploiement.
 * En développement, ?pushDebug=1 et localStorage carte:push-debug=1 restent pratiques.
 */
export function isPushDebugUiEnabled(): boolean {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_PUSH_DEBUG === "1";
  }
  if (process.env.NEXT_PUBLIC_PUSH_DEBUG === "1") return true;
  if (process.env.NODE_ENV !== "development") return false;
  try {
    if (new URLSearchParams(window.location.search).get("pushDebug") === "1") {
      return true;
    }
    if (window.localStorage?.getItem("carte:push-debug") === "1") {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

function pushDebugLogsEnabled(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  return process.env.NEXT_PUBLIC_PUSH_DEBUG === "1";
}

export function pushDebugLog(...args: unknown[]): void {
  if (!pushDebugLogsEnabled()) return;
  console.log("[Carte Push]", ...args);
}

export function hasPublicOneSignalAppId(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim());
}

export function publicOneSignalAppIdLength(): number {
  return process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim().length ?? 0;
}
