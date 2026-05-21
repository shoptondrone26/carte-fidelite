import {
  buildPushLaunchUrl,
  isOneSignalSendEnabled,
} from "@/lib/onesignal/config";
import { sendDirectPushToAdmins } from "@/lib/onesignal/direct-send";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Notifications push métier envoyées aux admins suite à une action client.
 * Toutes les fonctions sont fire-and-forget : ne bloquent jamais l’action,
 * et logguent en cas d’échec sans crasher.
 */

function logFailure(context: string, detail: string): void {
  // eslint-disable-next-line no-console -- erreur non bloquante
  console.error(`[admin-push:${context}]`, detail);
}

function runFireAndForget(task: () => Promise<void>): void {
  if (!isOneSignalSendEnabled()) return;
  void task().catch((err) => {
    logFailure("unhandled", err instanceof Error ? err.message : String(err));
  });
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
