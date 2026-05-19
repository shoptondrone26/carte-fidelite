import type { SupabaseClient } from "@supabase/supabase-js";

export type ShopDeliveryMethod = "pickup" | "chronopost_24h";

export type ShopOrderStatus =
  | "payment_pending"
  | "paid"
  | "preparing"
  | "shipped"
  | "completed"
  | "refused"
  | "cancelled"
  | "expired";

export type ShopOrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image_url: string | null;
  unit_price_eur: number;
  quantity: number;
  line_total_eur: number;
  sort_order: number;
};

export type ShopOrder = {
  id: string;
  profile_id: string;
  product_id: string | null;
  status: ShopOrderStatus;
  delivery_method: ShopDeliveryMethod;
  quantity: number;
  unit_price_eur: number;
  total_price_eur: number;
  product_name: string;
  product_image_url: string | null;
  admin_note: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  paid_at: string | null;
  preparing_at: string | null;
  shipped_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  refused_at: string | null;
  expired_at: string | null;
  handled_by: string | null;
  stock_reserved: boolean;
  items: ShopOrderItem[];
};

export type AdminShopOrder = ShopOrder & {
  profiles: {
    full_name: string | null;
    email: string | null;
    snap: string | null;
  } | null;
};

export const SHOP_ORDER_ACTIVE_STATUSES: ShopOrderStatus[] = [
  "payment_pending",
  "paid",
  "preparing",
  "shipped",
];

/** Dernière commande annulable depuis le carnet admin (y compris terminée pour remboursement). */
export const SHOP_ORDER_ADMIN_CANCELLABLE_STATUSES: ShopOrderStatus[] = [
  ...SHOP_ORDER_ACTIVE_STATUSES,
  "completed",
];

export type ClientLatestShopOrderSnippet = {
  id: string;
  status: ShopOrderStatus;
  product_name: string;
  total_price_eur: number;
  created_at: string;
};

export function isAdminCancellableLatestShopOrder(
  order: { status: string } | null | undefined,
): order is ClientLatestShopOrderSnippet {
  return (
    order !== null &&
    order !== undefined &&
    SHOP_ORDER_ADMIN_CANCELLABLE_STATUSES.includes(
      order.status as ShopOrderStatus,
    )
  );
}

export function buildLatestShopOrderByClient(
  rows: (ClientLatestShopOrderSnippet & { profile_id: string })[],
): Map<string, ClientLatestShopOrderSnippet> {
  const map = new Map<string, ClientLatestShopOrderSnippet>();
  for (const row of rows) {
    if (!map.has(row.profile_id)) {
      map.set(row.profile_id, {
        id: row.id,
        status: row.status,
        product_name: row.product_name,
        total_price_eur: Number(row.total_price_eur),
        created_at: row.created_at,
      });
    }
  }
  return map;
}

export const SHOP_ORDER_ADMIN_QUEUE_STATUSES: ShopOrderStatus[] = [
  ...SHOP_ORDER_ACTIVE_STATUSES,
];

export const shopDeliveryLabelFr: Record<ShopDeliveryMethod, string> = {
  pickup: "Remise en main propre",
  chronopost_24h: "Livraison Chronopost 24h",
};

export const shopOrderStatusLabelFr: Record<ShopOrderStatus, string> = {
  payment_pending: "Paiement en attente",
  paid: "Paiement reçu",
  preparing: "En préparation",
  shipped: "Envoyé",
  completed: "Terminé",
  refused: "Refusée",
  cancelled: "Annulée",
  expired: "Expirée",
};

export function shopOrderClientMessage(status: ShopOrderStatus): string {
  switch (status) {
    case "payment_pending":
      return "Rendez-vous sur Snapchat pour finaliser le paiement avec ShopTonDrone.";
    case "paid":
      return "Paiement confirmé. Votre commande est en cours de traitement.";
    case "preparing":
      return "Votre commande est en préparation.";
    case "shipped":
      return "Votre commande a été expédiée.";
    case "completed":
      return "Commande terminée. Merci pour votre confiance.";
    case "refused":
      return "Commande refusée.";
    case "cancelled":
      return "Commande annulée.";
    case "expired":
      return "Délai de paiement dépassé. Le stock a été libéré.";
  }
}

export function isActiveShopOrder(order: ShopOrder): boolean {
  return SHOP_ORDER_ACTIVE_STATUSES.includes(order.status);
}

export function shopOrderLineItems(order: ShopOrder): ShopOrderItem[] {
  if (order.items.length > 0) {
    return [...order.items].sort((a, b) => a.sort_order - b.sort_order);
  }
  if (order.product_id) {
    return [
      {
        id: `${order.id}-legacy`,
        order_id: order.id,
        product_id: order.product_id,
        product_name: order.product_name,
        product_image_url: order.product_image_url,
        unit_price_eur: order.unit_price_eur,
        quantity: order.quantity,
        line_total_eur: order.total_price_eur,
        sort_order: 0,
      },
    ];
  }
  return [];
}

export function shopOrderDisplayTitle(order: ShopOrder): string {
  const lines = shopOrderLineItems(order);
  if (lines.length === 0) return order.product_name;
  if (lines.length === 1) {
    const line = lines[0]!;
    return line.quantity > 1
      ? `${line.product_name} × ${line.quantity}`
      : line.product_name;
  }
  return order.product_name;
}

const ORDER_SELECT =
  "id, profile_id, product_id, status, delivery_method, quantity, unit_price_eur, total_price_eur, product_name, product_image_url, admin_note, tracking_number, created_at, updated_at, expires_at, paid_at, preparing_at, shipped_at, completed_at, cancelled_at, refused_at, expired_at, handled_by, stock_reserved";

const ITEM_SELECT =
  "id, order_id, product_id, product_name, product_image_url, unit_price_eur, quantity, line_total_eur, sort_order";

const ORDER_WITH_ITEMS_SELECT = `${ORDER_SELECT}, shop_order_items(${ITEM_SELECT})`;

type ShopOrderItemRow = Omit<
  ShopOrderItem,
  "unit_price_eur" | "line_total_eur"
> & {
  unit_price_eur: number | string;
  line_total_eur: number | string;
};

type ShopOrderRow = Omit<
  ShopOrder,
  "status" | "delivery_method" | "unit_price_eur" | "total_price_eur" | "items"
> & {
  status: string;
  delivery_method: string;
  unit_price_eur: number | string;
  total_price_eur: number | string;
  shop_order_items?: ShopOrderItemRow[] | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  snap: string | null;
};

function mapShopOrderItem(row: ShopOrderItemRow): ShopOrderItem {
  return {
    ...row,
    unit_price_eur: Number(row.unit_price_eur),
    line_total_eur: Number(row.line_total_eur),
  };
}

function mapShopOrder(row: ShopOrderRow): ShopOrder {
  const items = ((row.shop_order_items ?? []) as ShopOrderItemRow[])
    .map(mapShopOrderItem)
    .sort((a, b) => a.sort_order - b.sort_order);

  const { shop_order_items: _items, ...rest } = row;

  return {
    ...rest,
    status: rest.status as ShopOrderStatus,
    delivery_method: rest.delivery_method as ShopDeliveryMethod,
    unit_price_eur: Number(rest.unit_price_eur),
    total_price_eur: Number(rest.total_price_eur),
    tracking_number: rest.tracking_number ?? null,
    items,
  };
}

export async function refreshShopOrders(supabase: SupabaseClient): Promise<void> {
  await supabase.rpc("expire_shop_orders");
}

export async function fetchClientShopOrders(
  supabase: SupabaseClient,
  profileId: string,
): Promise<ShopOrder[]> {
  await refreshShopOrders(supabase);

  const { data, error } = await supabase
    .from("shop_orders")
    .select(ORDER_WITH_ITEMS_SELECT)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("fetchClientShopOrders", error.message);
    return [];
  }

  return ((data as ShopOrderRow[] | null) ?? []).map(mapShopOrder);
}

export async function fetchClientActiveShopOrders(
  supabase: SupabaseClient,
  profileId: string,
): Promise<ShopOrder[]> {
  const orders = await fetchClientShopOrders(supabase, profileId);
  return orders.filter(isActiveShopOrder);
}

export async function fetchAdminShopOrders(
  supabase: SupabaseClient,
): Promise<AdminShopOrder[]> {
  await refreshShopOrders(supabase);

  const { data, error } = await supabase
    .from("shop_orders")
    .select(ORDER_WITH_ITEMS_SELECT)
    .in("status", SHOP_ORDER_ADMIN_QUEUE_STATUSES)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("fetchAdminShopOrders", error.message);
    return [];
  }

  const rows = ((data as ShopOrderRow[] | null) ?? []).map(mapShopOrder);
  const profileIds = [...new Set(rows.map((row) => row.profile_id))];
  const profilesById = new Map<string, ProfileRow>();

  if (profileIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, snap")
      .in("id", profileIds);

    if (profileError) {
      console.error("fetchAdminShopOrders profiles", profileError.message);
    } else {
      for (const profile of (profiles as ProfileRow[] | null) ?? []) {
        profilesById.set(profile.id, profile);
      }
    }
  }

  return rows.map((order) => ({
    ...order,
    profiles: profilesById.get(order.profile_id) ?? null,
  }));
}

export function shopOrdersChannelName(userId: string): string {
  return `shop-orders:${userId}`;
}
