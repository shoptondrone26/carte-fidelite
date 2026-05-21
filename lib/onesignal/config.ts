export function isOneSignalClientEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim());
}

/** Nom d’env documenté pour activer les logs + panneau diagnostic push */
export const PUSH_DEBUG_ENV = "NEXT_PUBLIC_PUSH_DEBUG";

/** Endpoint officiel push (Create message API). */
export const ONESIGNAL_NOTIFICATIONS_URL =
  "https://api.onesignal.com/notifications?c=push";

/**
 * Clé REST / App API Key (serveur uniquement).
 * Retire espaces, retours ligne et préfixes Bearer/Key copiés par erreur dans l’env.
 */
export function getOneSignalRestApiKey(): string | null {
  const raw = process.env.ONESIGNAL_REST_API_KEY;
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
  } else if (lower.startsWith("key ")) {
    key = key.slice(4).trim();
  }

  return key.length > 0 ? key : null;
}

export function isOneSignalSendEnabled(): boolean {
  return isOneSignalClientEnabled() && getOneSignalRestApiKey() != null;
}

/** Diagnostic env (jamais la clé en clair). DEBUG_ONESIGNAL=1 ou NODE_ENV=development */
export function logOneSignalEnvDebug(context: string): void {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.DEBUG_ONESIGNAL !== "1"
  ) {
    return;
  }

  const key = getOneSignalRestApiKey();
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim();

  // eslint-disable-next-line no-console -- diagnostic opt-in
  console.log(`[onesignal:${context}]`, {
    ONESIGNAL_REST_API_KEY_defined:
      typeof process.env.ONESIGNAL_REST_API_KEY === "string",
    restKeyPresent: Boolean(key),
    restKeyLength: key?.length ?? 0,
    restKeyLooksOsV2: key?.startsWith("os_v2_app_") ?? false,
    appIdPresent: Boolean(appId),
    appIdLength: appId?.length ?? 0,
    notificationsUrl: ONESIGNAL_NOTIFICATIONS_URL,
    authHeaderFormat: "Key <REST_API_KEY>",
  });
}

/** En-têtes REST OneSignal — Authorization: Key … (pas Bearer). */
export function getOneSignalNotificationHeaders(): Record<string, string> | null {
  const apiKey = getOneSignalRestApiKey();
  if (!apiKey) return null;

  return {
    "Content-Type": "application/json",
    Authorization: `Key ${apiKey}`,
  };
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
