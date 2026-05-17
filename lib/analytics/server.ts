import type {
  AnalyticsEventType,
  AnalyticsMetadata,
} from "@/lib/analytics/events";
import { createClient } from "@/lib/supabase/server";

export async function trackServerAnalyticsEvent(
  eventType: AnalyticsEventType,
  metadata: AnalyticsMetadata = {},
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("track_analytics_event", {
    p_event_type: eventType,
    p_metadata: metadata,
  });

  if (error && process.env.NODE_ENV === "development") {
    console.warn("[Analytics]", eventType, error.message);
  }
}

