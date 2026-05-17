"use client";

import { useEffect } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics/client";

export function PrivilegesAnalytics() {
  useEffect(() => {
    void trackAnalyticsEvent(
      "privilege_opened",
      { surface: "offres", name: "page" },
      { dedupeKey: "privilege_opened:offres" },
    );
  }, []);

  return null;
}

export function trackPrivilegeOpened(name: string) {
  void trackAnalyticsEvent("privilege_opened", { surface: "offres", name });
}

export function trackPrivilegeUsed(name: string) {
  void trackAnalyticsEvent("privilege_used", { surface: "offres", name });
}

