import { getOneSignalAppId, isOneSignalClientEnabled } from "@/lib/onesignal/config";

/**
 * Script inline exécuté avant OneSignalSDK.page.js (pattern officiel v16).
 * Évite la course où useEffect pousse init après que le SDK ait déjà drainé Deferred.
 */
export function getOneSignalBootstrapScript(): string | null {
  if (!isOneSignalClientEnabled()) return null;

  const appId = getOneSignalAppId();
  const initOptions: Record<string, unknown> = {
    appId,
    serviceWorkerPath: "/sw.js",
  };
  if (process.env.NODE_ENV === "development") {
    initOptions.allowLocalhostAsSecureOrigin = true;
  }

  const initJson = JSON.stringify(initOptions);

  return [
    "window.OneSignalDeferred=window.OneSignalDeferred||[];",
    "window.OneSignalDeferred.push(async function(OneSignal){",
    `await OneSignal.init(${initJson});`,
    "});",
  ].join("");
}
