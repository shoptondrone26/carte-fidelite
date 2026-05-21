import {
  getOneSignalAppId,
  getOneSignalKeyKind,
  getOneSignalRestApiKey,
  getPushTargetSiteUrl,
  logOneSignalEnvDebug,
  type OneSignalKeyKind,
} from "@/lib/onesignal/config";

export const ONESIGNAL_V2_NOTIFICATIONS_URL =
  "https://api.onesignal.com/notifications?c=push";

export const ONESIGNAL_LEGACY_NOTIFICATIONS_URL =
  "https://onesignal.com/api/v1/notifications";

export type OneSignalSendDebug = {
  serverRuntime: "nodejs";
  env_ONESIGNAL_REST_API_KEY: boolean;
  env_ONESIGNAL_APP_API_KEY: boolean;
  restKeyPresent: boolean;
  restKeyLength: number;
  keyKind: OneSignalKeyKind;
  authScheme: "Key" | "Basic";
  appIdPresent: boolean;
  appIdLength: number;
  endpoint: string;
  httpStatus?: number;
  oneSignalResponse?: string;
};

export type OneSignalSendResult =
  | { ok: true }
  | { ok: false; error: string; debug: OneSignalSendDebug };

function buildDebug(
  partial: Omit<
    OneSignalSendDebug,
    | "serverRuntime"
    | "env_ONESIGNAL_REST_API_KEY"
    | "env_ONESIGNAL_APP_API_KEY"
    | "restKeyPresent"
    | "restKeyLength"
    | "keyKind"
    | "authScheme"
    | "appIdPresent"
    | "appIdLength"
  > & {
    keyKind?: OneSignalKeyKind;
    authScheme?: "Key" | "Basic";
  },
): OneSignalSendDebug {
  const key = getOneSignalRestApiKey();
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim();
  const keyKind = partial.keyKind ?? getOneSignalKeyKind();
  const authScheme =
    partial.authScheme ?? (keyKind === "legacy_rest" ? "Basic" : "Key");

  return {
    serverRuntime: "nodejs",
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
    endpoint: partial.endpoint,
    httpStatus: partial.httpStatus,
    oneSignalResponse: partial.oneSignalResponse?.slice(0, 800),
  };
}

function authHeader(key: string, kind: OneSignalKeyKind): string | null {
  if (kind === "org_v2") return null;
  if (kind === "legacy_rest") {
    return `Basic ${key}`;
  }
  return `Key ${key}`;
}

function resolveUrl(pathOrUrl: string | undefined): string {
  const base = getPushTargetSiteUrl().replace(/\/$/, "");
  if (!pathOrUrl?.trim()) return `${base}/dashboard`;
  const raw = pathOrUrl.trim();
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `${base}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

/**
 * Envoi REST OneSignal (serveur uniquement).
 * @see https://documentation.onesignal.com/docs/en/keys-and-ids
 * @see https://documentation.onesignal.com/reference/quick-start-api-guide
 */
export async function postOneSignalNotification(input: {
  userId: string;
  title: string;
  body: string;
  url?: string;
}): Promise<OneSignalSendResult> {
  const apiKey = getOneSignalRestApiKey();
  if (!apiKey) {
    logOneSignalEnvDebug("post:missing_key");
    return {
      ok: false,
      error:
        "Clé API absente côté serveur (ONESIGNAL_REST_API_KEY ou ONESIGNAL_APP_API_KEY).",
      debug: buildDebug({
        keyKind: "missing",
        authScheme: "Key",
        endpoint: ONESIGNAL_V2_NOTIFICATIONS_URL,
      }),
    };
  }

  const keyKind = getOneSignalKeyKind();
  if (keyKind === "org_v2") {
    return {
      ok: false,
      error:
        "Clé Organization détectée (os_v2_org_…). Utilisez une App API Key (os_v2_app_…) dans ONESIGNAL_REST_API_KEY.",
      debug: buildDebug({
        keyKind,
        authScheme: "Key",
        endpoint: ONESIGNAL_V2_NOTIFICATIONS_URL,
      }),
    };
  }

  const authorization = authHeader(apiKey, keyKind);
  if (!authorization) {
    return {
      ok: false,
      error: "Type de clé API non supporté pour l’envoi de notifications.",
      debug: buildDebug({
        keyKind,
        authScheme: "Key",
        endpoint: ONESIGNAL_V2_NOTIFICATIONS_URL,
      }),
    };
  }

  let appId: string;
  try {
    appId = getOneSignalAppId();
  } catch {
    return {
      ok: false,
      error: "NEXT_PUBLIC_ONESIGNAL_APP_ID manquant côté serveur.",
      debug: buildDebug({
        keyKind,
        authScheme: keyKind === "legacy_rest" ? "Basic" : "Key",
        endpoint:
          keyKind === "legacy_rest"
            ? ONESIGNAL_LEGACY_NOTIFICATIONS_URL
            : ONESIGNAL_V2_NOTIFICATIONS_URL,
      }),
    };
  }

  const launchUrl = resolveUrl(input.url);
  const isLegacy = keyKind === "legacy_rest";
  const endpoint = isLegacy
    ? ONESIGNAL_LEGACY_NOTIFICATIONS_URL
    : ONESIGNAL_V2_NOTIFICATIONS_URL;

  // OneSignal refuse `url` + `web_url`/`app_url` ensemble.
  // → un seul champ de redirection : `web_url` (Web push / PWA).
  // `data.url` reste un payload data (pas un champ de redirection) : utile
  // côté service worker si on veut customiser le routage plus tard.
  const body = isLegacy
    ? {
        app_id: appId,
        include_external_user_ids: [input.userId],
        headings: { fr: input.title, en: input.title },
        contents: { fr: input.body, en: input.body },
        web_url: launchUrl,
        data: { url: launchUrl },
      }
    : {
        app_id: appId,
        target_channel: "push",
        include_aliases: { external_id: [input.userId] },
        headings: { fr: input.title, en: input.title },
        contents: { fr: input.body, en: input.body },
        web_url: launchUrl,
        data: { url: launchUrl },
      };

  logOneSignalEnvDebug(`post:${keyKind}`);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
    },
    body: JSON.stringify(body),
  });

  const responseText = await res.text();

  if (!res.ok) {
    const debug = buildDebug({
      keyKind,
      authScheme: keyKind === "legacy_rest" ? "Basic" : "Key",
      endpoint,
      httpStatus: res.status,
      oneSignalResponse: responseText,
    });

    logOneSignalEnvDebug(`post:failed:${res.status}`);
    if (process.env.DEBUG_ONESIGNAL === "1") {
      // eslint-disable-next-line no-console
      console.error("[onesignal:post:failed]", debug);
    }

    return {
      ok: false,
      error: formatOneSignalError(res.status, responseText, keyKind),
      debug,
    };
  }

  return { ok: true };
}

function formatOneSignalError(
  status: number,
  body: string,
  keyKind: OneSignalKeyKind,
): string {
  let parsed = body;
  try {
    const json = JSON.parse(body) as { errors?: string[] };
    if (Array.isArray(json.errors) && json.errors.length > 0) {
      parsed = json.errors.join(" ");
    }
  } catch {
    /* raw body */
  }

  if (status === 401 || /access denied|authorization/i.test(parsed)) {
    if (keyKind === "legacy_rest") {
      return `OneSignal a refusé la clé (HTTP ${status}). Vérifiez la Legacy REST API Key ou migrez vers une App API Key (os_v2_app_…). Détail : ${parsed.slice(0, 200)}`;
    }
    return `OneSignal a refusé la clé (HTTP ${status}). Utilisez une App API Key (os_v2_app_…) avec Authorization: Key — pas Bearer. Détail : ${parsed.slice(0, 200)}`;
  }

  return parsed.slice(0, 400) || `OneSignal HTTP ${status}`;
}
