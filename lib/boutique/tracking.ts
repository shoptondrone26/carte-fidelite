import type { ShopOrder } from "@/lib/boutique/orders";

const CHRONOPOST_TRACKING_BASE =
  "https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=";

/** URL Chronopost officielle pour suivre un colis. */
export function buildChronopostTrackingUrl(trackingNumber: string): string {
  const normalized = trackingNumber.trim();
  return `${CHRONOPOST_TRACKING_BASE}${encodeURIComponent(normalized)}`;
}

/** Commande Chronopost avec numéro de suivi renseigné. */
export function isChronopostTrackableOrder(order: ShopOrder): boolean {
  if (order.delivery_method !== "chronopost_24h") return false;
  return Boolean(order.tracking_number?.trim());
}

export function filterChronopostTrackableOrders(orders: ShopOrder[]): ShopOrder[] {
  return orders.filter(isChronopostTrackableOrder);
}
