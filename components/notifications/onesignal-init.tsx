"use client";

import Script from "next/script";
import { useEffect } from "react";

import {
  getOneSignalAppId,
  isOneSignalClientEnabled,
} from "@/lib/onesignal/config";
import { pushDebugLog } from "@/lib/push-debug";

export function OneSignalInit() {
  const enabled = isOneSignalClientEnabled();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    window.OneSignalDeferred = window.OneSignalDeferred ?? [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({
        appId: getOneSignalAppId(),
        serviceWorkerPath: "/sw.js",
        allowLocalhostAsSecureOrigin:
          process.env.NODE_ENV === "development",
      });
      pushDebugLog("OneSignal init terminé (appId length)", getOneSignalAppId().length);
      if ("serviceWorker" in navigator) {
        const existing = await navigator.serviceWorker.getRegistration("/");
        if (!existing) {
          await navigator.serviceWorker.register("/sw.js", { scope: "/" });
          pushDebugLog("Service Worker enregistré (/sw.js)");
        } else {
          pushDebugLog("Service Worker déjà enregistré");
        }
      }
    });
  }, [enabled]);

  if (!enabled) return null;

  return (
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
    />
  );
}
