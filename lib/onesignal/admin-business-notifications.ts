import { runAfterResponse } from "@/lib/onesignal/after-response";
import {
  buildPushLaunchUrl,
  isOneSignalSendEnabled,
} from "@/lib/onesignal/config";
import {
  sendDirectPushToAdmins,
  sendDirectPushToUser,
} from "@/lib/onesignal/direct-send";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Notifications push métier envoyées aux admins suite à une action client.
 * Exécutées via `after()` (Next 16) — garanti côté Vercel serverless.
 * Non bloquantes : aucune erreur ne remonte à l’UI client.
 */

function logFailure(context: string, detail: string): void {
  // eslint-disable-next-line no-console -- erreur non bloquante
  console.error(`[admin-push:${context}]`, detail);
}

function runFireAndForget(task: () => Promise<void>): void {
  if (!isOneSignalSendEnabled()) return;
  runAfterResponse(task);
}

function shortenName(fullName: string | null | undefined): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return "Un client";
  const first = trimmed.split(/\s+/)[0];
  return first || "Un client";
}

async function loadProfileFirstName(profileId: string): Promise<string> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return "Un client";
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", profileId)
    .maybeSingle();
  return shortenName(data?.full_name);
}

/** 2. Réservation annulée par le client → admins. */
export function notifyAdminsBookingCancelledByClient(input: {
  bookingId: string;
  clientProfileId: string;
}): void {
  runFireAndForget(async () => {
    const clientName = await loadProfileFirstName(input.clientProfileId);
    const batch = await sendDirectPushToAdmins({
      title: "Réservation annulée",
      body: `Un client a annulé sa réservation. (${clientName})`,
      url: buildPushLaunchUrl("/admin/reservations"),
    });
    if (batch.sent === 0 && batch.failed > 0) {
      logFailure(
        `booking_cancelled_by_client:${input.bookingId}`,
        batch.errors[0] ?? "aucun admin notifié",
      );
    }
  });
}

/** 3. Nouvelle demande Mode Fantôme → admins. */
export function notifyAdminsNewPhantomRequest(input: {
  clientProfileId: string;
  requestId?: string;
}): void {
  runFireAndForget(async () => {
    const clientName = await loadProfileFirstName(input.clientProfileId);
    const batch = await sendDirectPushToAdmins({
      title: "Nouvelle demande Mode Fantôme",
      body: `Un client vient de demander le Mode Fantôme. (${clientName})`,
      url: buildPushLaunchUrl("/admin"),
    });
    if (batch.sent === 0 && batch.failed > 0) {
      logFailure(
        `phantom_request:${input.requestId ?? input.clientProfileId}`,
        batch.errors[0] ?? "aucun admin notifié",
      );
    }
  });
}

type ShopOrderForPush = {
  id: string;
  profile_id: string;
  total_price_eur: number | string | null;
  delivery_method: string | null;
};

function formatEurAmount(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(num);
}

function describeDelivery(method: string | null | undefined): string | null {
  if (!method) return null;
  switch (method) {
    case "pickup":
      return "retrait sur place";
    case "chronopost_24h":
      return "Chronopost 24h";
    default:
      return method;
  }
}

async function loadShopOrderForPush(
  orderId: string,
): Promise<ShopOrderForPush | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return null;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("shop_orders")
    .select("id, profile_id, total_price_eur, delivery_method")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !data) {
    if (error) logFailure(`load_shop_order:${orderId}`, error.message);
    return null;
  }
  return data as ShopOrderForPush;
}

/** 4. Nouvelle commande boutique → admins. */
export function notifyAdminsNewShopOrder(orderId: string): void {
  runFireAndForget(async () => {
    const order = await loadShopOrderForPush(orderId);
    const clientName = order
      ? await loadProfileFirstName(order.profile_id)
      : "Un client";

    const amount = order ? formatEurAmount(order.total_price_eur) : null;
    const delivery = order ? describeDelivery(order.delivery_method) : null;

    const parts = [`${clientName} vient d’envoyer une demande boutique.`];
    if (amount) parts.push(`Total : ${amount}`);
    if (delivery) parts.push(`Livraison : ${delivery}`);

    const batch = await sendDirectPushToAdmins({
      title: "Nouvelle commande boutique",
      body: parts.join(" · "),
      url: buildPushLaunchUrl("/admin/boutique"),
    });
    if (batch.sent === 0 && batch.failed > 0) {
      logFailure(
        `shop_order_new:${orderId}`,
        batch.errors[0] ?? "aucun admin notifié",
      );
    }
  });
}

/** 5. Commande boutique annulée par le client → admins. */
export function notifyAdminsShopOrderCancelledByClient(orderId: string): void {
  runFireAndForget(async () => {
    const order = await loadShopOrderForPush(orderId);
    const clientName = order
      ? await loadProfileFirstName(order.profile_id)
      : "Un client";

    const batch = await sendDirectPushToAdmins({
      title: "Commande annulée",
      body: `${clientName} a annulé sa commande boutique.`,
      url: buildPushLaunchUrl("/admin/boutique"),
    });
    if (batch.sent === 0 && batch.failed > 0) {
      logFailure(
        `shop_order_cancelled_by_client:${orderId}`,
        batch.errors[0] ?? "aucun admin notifié",
      );
    }
  });
}

// ───────────────────────────────────────────────────────────────────────────
// Notifications client (suite à une action admin)
// ───────────────────────────────────────────────────────────────────────────

async function loadPhantomProfileId(requestId: string): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return null;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("phantom_requests")
    .select("profile_id")
    .eq("id", requestId)
    .maybeSingle();
  if (error || !data?.profile_id) {
    if (error) logFailure(`load_phantom:${requestId}`, error.message);
    return null;
  }
  return data.profile_id as string;
}

/** Mode Fantôme accepté par admin → client. */
export function notifyClientPhantomAccepted(requestId: string): void {
  runFireAndForget(async () => {
    const profileId = await loadPhantomProfileId(requestId);
    if (!profileId) return;
    const result = await sendDirectPushToUser(profileId, {
      title: "Mode Fantôme accepté",
      body: "Votre demande Mode Fantôme a été acceptée par ShopTonDrone.",
      url: buildPushLaunchUrl("/dashboard"),
    });
    if (!result.ok && !result.skipped) {
      logFailure(`phantom_accepted:${requestId}`, result.error);
    }
  });
}

/** Mode Fantôme refusé / annulé → client. */
export function notifyClientPhantomCancelled(requestId: string): void {
  runFireAndForget(async () => {
    const profileId = await loadPhantomProfileId(requestId);
    if (!profileId) return;
    const result = await sendDirectPushToUser(profileId, {
      title: "Mode Fantôme annulé",
      body: "Votre demande Mode Fantôme a été annulée.",
      url: buildPushLaunchUrl("/dashboard"),
    });
    if (!result.ok && !result.skipped) {
      logFailure(`phantom_cancelled:${requestId}`, result.error);
    }
  });
}

type ShopOrderForClientPush = {
  id: string;
  profile_id: string;
  tracking_number?: string | null;
};

async function loadShopOrderForClientPush(
  orderId: string,
): Promise<ShopOrderForClientPush | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return null;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("shop_orders")
    .select("id, profile_id, tracking_number")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !data) {
    if (error) logFailure(`load_shop_order_client:${orderId}`, error.message);
    return null;
  }
  return data as ShopOrderForClientPush;
}

export type ShopOrderClientStatus =
  | "paid"
  | "preparing"
  | "shipped"
  | "completed"
  | "cancelled"
  | "refused"
  | "expired";

type ShopOrderPushTemplate = {
  title: string;
  body: (tracking?: string | null) => string;
};

const SHOP_ORDER_PUSH_TEMPLATES: Record<ShopOrderClientStatus, ShopOrderPushTemplate> = {
  paid: {
    title: "Paiement confirmé",
    body: () => "Votre paiement a été confirmé. Préparation à venir.",
  },
  preparing: {
    title: "Commande en préparation",
    body: () => "Votre commande boutique est en cours de préparation.",
  },
  shipped: {
    title: "Commande expédiée",
    body: (tracking) =>
      tracking?.trim()
        ? "Votre commande a été expédiée. Suivez votre colis Chronopost."
        : "Votre commande est en route via Chronopost.",
  },
  completed: {
    title: "Commande terminée",
    body: () => "Votre commande boutique a été finalisée. Merci !",
  },
  cancelled: {
    title: "Commande annulée",
    body: () => "Votre commande boutique a été annulée.",
  },
  refused: {
    title: "Commande refusée",
    body: () => "Votre commande boutique a été refusée.",
  },
  expired: {
    title: "Commande expirée",
    body: () =>
      "Votre commande boutique a expiré faute de paiement dans les temps.",
  },
};

async function dispatchShopOrderStatusPush(
  order: ShopOrderForClientPush,
  status: ShopOrderClientStatus,
  context: string,
): Promise<void> {
  const template = SHOP_ORDER_PUSH_TEMPLATES[status];
  if (!template) return;

  const result = await sendDirectPushToUser(order.profile_id, {
    title: template.title,
    body: template.body(order.tracking_number),
    url: buildPushLaunchUrl(
      status === "shipped" && order.tracking_number?.trim()
        ? "/suivi-colis"
        : "/boutique",
    ),
  });

  if (!result.ok && !result.skipped) {
    logFailure(context, result.error);
  }
}

/** Mise à jour de statut d’une commande boutique → client. */
export function notifyClientShopOrderStatus(
  orderId: string,
  status: ShopOrderClientStatus,
): void {
  runFireAndForget(async () => {
    const order = await loadShopOrderForClientPush(orderId);
    if (!order) return;
    await dispatchShopOrderStatusPush(
      order,
      status,
      `shop_order_status_${status}:${orderId}`,
    );
  });
}

/** Annulation par admin de la dernière commande d’un client → client. */
export function notifyClientLatestShopOrderCancelled(profileId: string): void {
  runFireAndForget(async () => {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return;
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("shop_orders")
      .select("id, profile_id, tracking_number")
      .eq("profile_id", profileId)
      .eq("status", "cancelled")
      .order("cancelled_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      logFailure(`load_latest_cancelled_shop_order:${profileId}`, error.message);
      return;
    }
    if (!data) return;
    await dispatchShopOrderStatusPush(
      data as ShopOrderForClientPush,
      "cancelled",
      `shop_order_admin_cancelled_latest:${data.id}`,
    );
  });
}
