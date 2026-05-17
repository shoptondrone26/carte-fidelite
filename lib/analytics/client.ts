"use client";

import type {
  AnalyticsEventType,
  AnalyticsMetadata,
} from "@/lib/analytics/events";
import { createClient } from "@/lib/supabase/client";

type TrackOptions = {
  dedupeKey?: string;
};

function alreadyTrackedThisSession(key: string): boolean {
  try {
    const storageKey = `analytics:${key}`;
    if (window.sessionStorage.getItem(storageKey) === "1") return true;
    window.sessionStorage.setItem(storageKey, "1");
  } catch {
    return false;
  }
  return false;
}

export async function trackAnalyticsEvent(
  eventType: AnalyticsEventType,
  metadata: AnalyticsMetadata = {},
  options: TrackOptions = {},
): Promise<void> {
  if (options.dedupeKey && alreadyTrackedThisSession(options.dedupeKey)) {
    return;
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("track_analytics_event", {
    p_event_type: eventType,
    p_metadata: metadata,
  });

  if (error && process.env.NODE_ENV === "development") {
    console.warn("[Analytics]", eventType, error.message);
  }
}

