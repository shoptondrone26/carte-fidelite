export const ANALYTICS_EVENT_TYPES = [
  "app_open",
  "dashboard_open",
  "booking_created",
  "booking_accepted",
  "booking_refused",
  "unlock_validated",
  "privilege_opened",
  "privilege_used",
  "login",
  "signup",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export type AnalyticsMetadata = Record<
  string,
  string | number | boolean | null | undefined
>;

