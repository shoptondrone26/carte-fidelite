"use client";

import Script from "next/script";

import { isOneSignalClientEnabled } from "@/lib/onesignal/config";

/** Charge le SDK page OneSignal v16 (init via bootstrap dans app/layout). */
export function OneSignalInit() {
  if (!isOneSignalClientEnabled()) return null;

  return (
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
    />
  );
}
