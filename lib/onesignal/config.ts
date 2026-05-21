export function isOneSignalClientEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim());
}

/** Nom d’env documenté pour activer les logs + panneau diagnostic push */
export const PUSH_DEBUG_ENV = "NEXT_PUBLIC_PUSH_DEBUG";

export type OneSignalKeyKind =
  | "app_v2"
  | "legacy_rest"
  | "org_v2"
  | "missing";

/** @deprecated Utiliser ONESIGNAL_V2_NOTIFICATIONS_URL dans api-request.ts */
export const ONESIGNAL_NOTIFICATIONS_URL =
  "https://api.onesignal.com/notifications?c=push";

/**
 * App API Key ou Legacy REST API Key (serveur uniquement).
 * Lit ONESIGNAL_REST_API_KEY puis ONESIGNAL_APP_API_KEY (nom doc officiel).
 */
export function getOneSignalRestApiKey(): string | null {
  const raw =
    process.env.ONESIGNAL_REST_API_KEY ?? process.env.ONESIGNAL_APP_API_KEY;
  if (typeof raw !== "string") return null;

  let key = raw.replace(/\r/g, "").replace(/\n/g, "").trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  const lower = key.toLowerCase();
  if (lower.startsWith("bearer ")) {
    key = key.slice(7).trim();
  } else if (lower.startsWith("basic ")) {
    key = key.slice(6).trim();
  } else if (lower.startsWith("key ")) {
    key = key.slice(4).trim();
  }

  return key.length > 0 ? key : null;
}

export function getOneSignalKeyKind(): OneSignalKeyKind {
  const key = getOneSignalRestApiKey();
  if (!key) return "missing";
  if (key.startsWith("os_v2_app_")) return "app_v2";
  if (key.startsWith("os_v2_org_")) return "org_v2";
  return "legacy_rest";
}

export function isOneSignalSendEnabled(): boolean {
  return isOneSignalClientEnabled() && getOneSignalRestApiKey() != null;
}

/** Diagnostic env (jamais la clé en clair). Toujours en cas d’échec HTTP ; sinon DEBUG_ONESIGNAL=1 ou dev. */
export function logOneSignalEnvDebug(
  context: string,
  extra?: Record<string, unknown>,
): void {
  const key = getOneSignalRestApiKey();
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim();
  const keyKind = getOneSignalKeyKind();
  const authScheme = keyKind === "legacy_rest" ? "Basic" : "Key";

  const always =
    context.includes("failed") ||
    context.includes("missing") ||
    process.env.DEBUG_ONESIGNAL === "1" ||
    process.env.NODE_ENV !== "production";

  if (!always) return;

  // eslint-disable-next-line no-console -- diagnostic serveur
  console.log(`[onesignal:${context}]`, {
    env_ONESIGNAL_REST_API_KEY:
      typeof process.env.ONESIGNAL_REST_API_KEY === "string",
    env_ONESIGNAL_APP_API_KEY:
      typeof process.env.ONESIGNAL_APP_API_KEY === "string",
    restKeyPresent: Boolean(key),
    restKeyLength: key?.length ?? 0,
    keyKind,
    authScheme,
    appIdPresent: Boolean(appId),
    appIdLength: appId?.length ?? 0,
    ...extra,
  });
}

/** @deprecated Alias — envoi serveur */
export function isOneSignalEnabled(): boolean {
  return isOneSignalSendEnabled();
}

export function getOneSignalAppId(): string {
  const id = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim();
  if (!id) {
    throw new Error("NEXT_PUBLIC_ONESIGNAL_APP_ID manquant");
  }
  return id;
}

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    return process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
