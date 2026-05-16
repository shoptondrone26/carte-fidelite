"use client";

/**
 * Diagnostic push : UI + logs sans exposer de secrets.
 * Active avec NEXT_PUBLIC_PUSH_DEBUG=1, ?pushDebug=1 ou localStorage carte:push-debug=1
 */
export function isPushDebugUiEnabled(): boolean {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_PUSH_DEBUG === "1";
  }
  if (process.env.NEXT_PUBLIC_PUSH_DEBUG === "1") return true;
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
  if (process.env.NEXT_PUBLIC_PUSH_DEBUG === "1") return true;
  try {
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("pushDebug") === "1"
    ) {
      return true;
    }
    if (
      typeof window !== "undefined" &&
      window.localStorage?.getItem("carte:push-debug") === "1"
    ) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
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
