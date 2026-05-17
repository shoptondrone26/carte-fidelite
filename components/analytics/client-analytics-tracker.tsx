"use client";

import { useEffect } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics/client";

export function ClientAnalyticsTracker() {
  useEffect(() => {
    void trackAnalyticsEvent(
      "app_open",
      {
        path: window.location.pathname,
        standalone: window.matchMedia("(display-mode: standalone)").matches,
      },
      { dedupeKey: "app_open" },
    );
  }, []);

  return null;
}

