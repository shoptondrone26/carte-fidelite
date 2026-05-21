"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ShopDeliveryMethod, ShopOrder } from "@/lib/boutique/orders";
import { fetchClientActiveShopOrders } from "@/lib/boutique/orders";
import type { ShopPaymentMethod } from "@/lib/boutique/payment";
import { getIsAdmin } from "@/lib/auth/roles";
import {
  notifyAdminsNewShopOrder,
  notifyAdminsShopOrderCancelledByClient,
} from "@/lib/onesignal/admin-business-notifications";
import { createClient } from "@/lib/supabase/server";

const orderIdSchema = z.string().uuid();
const deliverySchema = z.enum(["pickup", "chronopost_24h"]);
const paymentMethodSchema = z.enum(["wire_transfer", "paysafecard", "mixed"]);
const pscAmountSchema = z.coerce.number().min(0).max(999_999);
const productIdSchema = z.string().uuid();
const quantitySchema = z.coerce.number().int().min(1).max(99);
const cartLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: quantitySchema,
});
const adminStatusSchema = z.enum([
  "paid",
  "preparing",
  "shipped",
  "completed",
  "refused",
  "cancelled",
]);

export type ShopOrderActionResult =
  | { ok: true; order?: ShopOrder }
  | { ok: false; error: string };

function mapRpcOrder(row: Record<string, unknown> | null): ShopOrder | undefined {
  if (!row) return undefined;
  return {
    id: String(row.id),
    profile_id: String(row.profile_id),
    product_id: row.product_id != null ? String(row.product_id) : null,
    status: row.status as ShopOrder["status"],
    delivery_method: row.delivery_method as ShopDeliveryMethod,
    quantity: Number(row.quantity),
    unit_price_eur: Number(row.unit_price_eur),
    subtotal_eur: Number(row.subtotal_eur ?? row.total_price_eur),
    payment_method: (row.payment_method ?? "wire_transfer") as ShopPaymentMethod,
    psc_amount_eur: Number(row.psc_amount_eur ?? 0),
    payment_fee_eur: Number(row.payment_fee_eur ?? 0),
    total_price_eur: Number(row.total_price_eur),
    product_name: String(row.product_name),
    product_image_url: (row.product_image_url as string | null) ?? null,
    admin_note: (row.admin_note as string | null) ?? null,
    tracking_number: (row.tracking_number as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    expires_at: String(row.expires_at),
    paid_at: (row.paid_at as string | null) ?? null,
    preparing_at: (row.preparing_at as string | null) ?? null,
    shipped_at: (row.shipped_at as string | null) ?? null,
    completed_at: (row.completed_at as string | null) ?? null,
    cancelled_at: (row.cancelled_at as string | null) ?? null,
    refused_at: (row.refused_at as string | null) ?? null,
    expired_at: (row.expired_at as string | null) ?? null,
    handled_by: (row.handled_by as string | null) ?? null,
    stock_reserved: Boolean(row.stock_reserved),
    items: [],
  };
}

function mapShopOrderRpcError(error: { message: string }): string {
  if (error.message.includes("insufficient_stock")) {
    return "Stock insuffisant pour un ou plusieurs produits.";
  }
  if (error.message.includes("active_order_exists")) {
    return "Une commande est déjà en cours pour un produit de votre panier.";
  }
  if (error.message.includes("product_not_found")) {
    return "Produit indisponible.";
  }
  if (error.message.includes("client_only")) {
    return "Action réservée aux clients.";
  }
  if (error.message.includes("invalid_quantity")) {
    return "Quantité invalide.";
  }
  if (error.message.includes("empty_cart") || error.message.includes("invalid_lines")) {
    return "Panier invalide.";
  }
  return error.message;
}

export async function createShopOrderAction(
  rawProductId: unknown,
  rawDeliveryMethod: unknown,
  rawQuantity?: unknown,
  rawPaymentMethod?: unknown,
  rawPscAmountEur?: unknown,
): Promise<ShopOrderActionResult> {
  const productId = productIdSchema.safeParse(rawProductId);
  const delivery = deliverySchema.safeParse(rawDeliveryMethod);
  const quantity = quantitySchema.safeParse(rawQuantity ?? 1);
  const paymentParsed = paymentMethodSchema.safeParse(
    rawPaymentMethod ?? "wire_transfer",
  );
  const pscParsed = pscAmountSchema.safeParse(rawPscAmountEur ?? 0);
  if (
    !productId.success ||
    !delivery.success ||
    !quantity.success ||
    !paymentParsed.success ||
    !pscParsed.success
  ) {
    return { ok: false, error: "Commande invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Connexion requise." };
  }

  const { data, error } = await supabase.rpc("create_shop_order", {
    p_product_id: productId.data,
    p_delivery_method: delivery.data,
    p_quantity: quantity.data,
    p_payment_method: paymentParsed.data,
    p_psc_amount_eur: pscParsed.data,
  });

  if (error) {
    return { ok: false, error: mapShopOrderRpcError(error) };
  }

  revalidatePath("/boutique");
  revalidatePath("/admin");
  revalidatePath("/admin/boutique");

  const order = mapRpcOrder(data as Record<string, unknown>);
  if (order?.id) {
    notifyAdminsNewShopOrder(order.id);
  }

  return { ok: true, order };
}

export type SubmitShopCartResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function submitShopCartOrdersAction(
  rawLines: unknown,
  rawDeliveryMethod: unknown,
  rawPaymentMethod?: unknown,
  rawPscAmountEur?: unknown,
): Promise<SubmitShopCartResult> {
  const delivery = deliverySchema.safeParse(rawDeliveryMethod);
  if (!delivery.success) {
    return { ok: false, error: "Mode de livraison invalide." };
  }

  const paymentParsed = paymentMethodSchema.safeParse(
    rawPaymentMethod ?? "wire_transfer",
  );
  if (!paymentParsed.success) {
    return { ok: false, error: "Mode de paiement invalide." };
  }

  const pscParsed = pscAmountSchema.safeParse(rawPscAmountEur ?? 0);
  if (!pscParsed.success) {
    return { ok: false, error: "Montant Paysafecard invalide." };
  }

  if (
    paymentParsed.data === "mixed" &&
    delivery.data === "chronopost_24h" &&
    pscParsed.data <= 0
  ) {
      return {
        ok: false,
        error: "Indiquez le montant Paysafecard pour le mode mixte.",
      };
  }

  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    return { ok: false, error: "Panier vide." };
  }

  const lines: { product_id: string; quantity: number }[] = [];
  for (const raw of rawLines) {
    const parsed = cartLineSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: "Panier invalide." };
    }
    lines.push({
      product_id: parsed.data.productId,
      quantity: parsed.data.quantity,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Connexion requise." };
  }

  const { data, error } = await supabase.rpc("create_shop_cart_order", {
    p_lines: lines,
    p_delivery_method: delivery.data,
    p_payment_method: paymentParsed.data,
    p_psc_amount_eur: pscParsed.data,
  });

  if (error) {
    return { ok: false, error: mapShopOrderRpcError(error) };
  }

  revalidatePath("/boutique");
  revalidatePath("/admin");
  revalidatePath("/admin/boutique");

  const order = mapRpcOrder(data as Record<string, unknown>);
  const orderId = order?.id ?? String((data as { id: string }).id);

  if (orderId) {
    notifyAdminsNewShopOrder(orderId);
  }

  return { ok: true, orderId };
}

export async function cancelShopOrderAction(
  rawOrderId: unknown,
): Promise<ShopOrderActionResult> {
  const orderId = orderIdSchema.safeParse(rawOrderId);
  if (!orderId.success) {
    return { ok: false, error: "Commande invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Connexion requise." };
  }

  const { error } = await supabase.rpc("cancel_shop_order", {
    p_order_id: orderId.data,
  });

  if (error) {
    if (error.message.includes("invalid_state")) {
      return {
        ok: false,
        error: "Cette commande ne peut plus être annulée.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/boutique");
  revalidatePath("/admin");
  revalidatePath("/admin/boutique");

  notifyAdminsShopOrderCancelledByClient(orderId.data);

  return { ok: true };
}

export async function adminUpdateShopOrderStatusAction(
  rawOrderId: unknown,
  rawStatus: unknown,
  rawAdminNote?: unknown,
  rawTrackingNumber?: unknown,
): Promise<ShopOrderActionResult> {
  const orderId = orderIdSchema.safeParse(rawOrderId);
  const status = adminStatusSchema.safeParse(rawStatus);
  if (!orderId.success || !status.success) {
    return { ok: false, error: "Commande invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await getIsAdmin(supabase, user.id))) {
    return { ok: false, error: "Accès réservé aux administrateurs." };
  }

  const adminNote =
    typeof rawAdminNote === "string" ? rawAdminNote.trim() : null;
  const trackingNumber =
    typeof rawTrackingNumber === "string" ? rawTrackingNumber.trim() : null;

  const { error } = await supabase.rpc("admin_update_shop_order_status", {
    p_order_id: orderId.data,
    p_status: status.data,
    p_admin_note: adminNote || null,
    p_tracking_number: trackingNumber || null,
  });

  if (error) {
    if (error.message.includes("invalid_transition")) {
      return { ok: false, error: "Transition de statut impossible." };
    }
    if (error.message.includes("invalid_state")) {
      return { ok: false, error: "Cette commande est déjà clôturée." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/boutique");
  revalidatePath("/admin");
  revalidatePath("/admin/boutique");

  return { ok: true };
}

const profileIdSchema = z.string().uuid();

export async function adminCancelLatestShopOrderAction(
  rawProfileId: unknown,
): Promise<ShopOrderActionResult> {
  const profileId = profileIdSchema.safeParse(rawProfileId);
  if (!profileId.success) {
    return { ok: false, error: "Client invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await getIsAdmin(supabase, user.id))) {
    return { ok: false, error: "Accès réservé aux administrateurs." };
  }

  const { error } = await supabase.rpc("admin_cancel_latest_shop_order", {
    p_profile_id: profileId.data,
  });

  if (error) {
    if (error.message.includes("not_found")) {
      return { ok: false, error: "Aucune commande boutique à annuler." };
    }
    if (error.message.includes("not_cancellable")) {
      return {
        ok: false,
        error: "La dernière commande ne peut plus être annulée.",
      };
    }
    if (error.message.includes("already_cancelled")) {
      return { ok: false, error: "Cette commande est déjà annulée." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/boutique");
  revalidatePath("/admin");
  revalidatePath("/admin/boutique");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/compta");

  return { ok: true };
}

export async function fetchClientActiveShopOrdersAction(): Promise<ShopOrder[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return fetchClientActiveShopOrders(supabase, user.id);
}
