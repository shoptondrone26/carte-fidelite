export type AdminRealtimeSubscription = {
  table:
    | "bookings"
    | "history"
    | "accounting_transactions"
    | "profiles"
    | "analytics_events"
    | "phantom_requests"
    | "shop_products"
    | "shop_orders";
  event: "INSERT" | "UPDATE" | "DELETE" | "*";
};

export const ADMIN_BOOKINGS_SYNC: AdminRealtimeSubscription[] = [
  { table: "bookings", event: "*" },
  { table: "history", event: "INSERT" },
];

export const ADMIN_REQUESTS_SYNC: AdminRealtimeSubscription[] = [
  ...ADMIN_BOOKINGS_SYNC,
  { table: "phantom_requests", event: "*" },
];

export const ADMIN_COMPTA_SYNC: AdminRealtimeSubscription[] = [
  { table: "accounting_transactions", event: "INSERT" },
  { table: "history", event: "INSERT" },
  { table: "profiles", event: "UPDATE" },
];

export const ADMIN_CLIENTS_SYNC: AdminRealtimeSubscription[] = [
  { table: "accounting_transactions", event: "INSERT" },
  { table: "profiles", event: "INSERT" },
  { table: "profiles", event: "UPDATE" },
  { table: "phantom_requests", event: "*" },
  { table: "history", event: "INSERT" },
];

export const ADMIN_HISTORY_SYNC: AdminRealtimeSubscription[] = [
  { table: "history", event: "INSERT" },
  { table: "profiles", event: "UPDATE" },
];

export const ADMIN_HOME_SYNC: AdminRealtimeSubscription[] = [
  ...ADMIN_REQUESTS_SYNC,
  { table: "shop_orders", event: "*" },
  { table: "profiles", event: "INSERT" },
  { table: "profiles", event: "UPDATE" },
];

export const ADMIN_BOUTIQUE_SYNC: AdminRealtimeSubscription[] = [
  { table: "shop_products", event: "*" },
  { table: "shop_orders", event: "*" },
];

export const ADMIN_ANALYSE_SYNC: AdminRealtimeSubscription[] = [
  { table: "analytics_events", event: "INSERT" },
  { table: "bookings", event: "*" },
  { table: "history", event: "INSERT" },
  { table: "profiles", event: "INSERT" },
  { table: "profiles", event: "UPDATE" },
];
