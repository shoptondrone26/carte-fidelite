"use client";

import Script from "next/script";
import { useEffect } from "react";

import { isOneSignalClientEnabled } from "@/lib/onesignal/config";
import { runOneSignalTask } from "@/lib/onesignal/subscription-sync";
import { pushDebugLog } from "@/lib/push-debug";

export function OneSignalInit() {
  const enabled = isOneSignalClientEnabled();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    void runOneSignalTask(async () => {
      pushDebugLog("OneSignal SDK prêt (client)");
      if ("serviceWorker" in navigator) {
        const existing = await navigator.serviceWorker.getRegistration("/");
        if (!existing) {
          await navigator.serviceWorker.register("/sw.js", { scope: "/" });
          pushDebugLog("Service Worker enregistré (/sw.js)");
        } else {
          pushDebugLog("Service Worker déjà enregistré");
        }
      }
    }, 60_000).catch(() => {
      /* init géré par bootstrap layout ; SW optionnel */
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
