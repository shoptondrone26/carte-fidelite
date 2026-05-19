"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ShopDeliveryMethod, ShopOrder } from "@/lib/boutique/orders";
import { fetchClientActiveShopOrders } from "@/lib/boutique/orders";
import { getIsAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const orderIdSchema = z.string().uuid();
const deliverySchema = z.enum(["pickup", "chronopost_24h"]);
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
    product_id: String(row.product_id),
    status: row.status as ShopOrder["status"],
    delivery_method: row.delivery_method as ShopDeliveryMethod,
    quantity: Number(row.quantity),
    unit_price_eur: Number(row.unit_price_eur),
    total_price_eur: Number(row.total_price_eur),
    product_name: String(row.product_name),
    product_image_url: (row.product_image_url as string | null) ?? null,
    admin_note: (row.admin_note as string | null) ?? null,
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
  };
}

function mapShopOrderRpcError(error: { message: string }): string {
  if (error.message.includes("insufficient_stock")) {
    return "Produit en rupture de stock.";
  }
  if (error.message.includes("active_order_exists")) {
    return "Une commande est déjà en cours pour ce produit.";
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
  return error.message;
}

export async function createShopOrderAction(
  rawProductId: unknown,
  rawDeliveryMethod: unknown,
  rawQuantity?: unknown,
): Promise<ShopOrderActionResult> {
  const productId = productIdSchema.safeParse(rawProductId);
  const delivery = deliverySchema.safeParse(rawDeliveryMethod);
  const quantity = quantitySchema.safeParse(rawQuantity ?? 1);
  if (!productId.success || !delivery.success || !quantity.success) {
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
  });

  if (error) {
    return { ok: false, error: mapShopOrderRpcError(error) };
  }

  revalidatePath("/boutique");
  revalidatePath("/admin");
  revalidatePath("/admin/boutique");

  return { ok: true, order: mapRpcOrder(data as Record<string, unknown>) };
}

export type SubmitShopCartResult =
  | {
      ok: true;
      created: number;
      partial?: boolean;
      failures: { productId: string; name: string; error: string }[];
    }
  | { ok: false; error: string };

export async function submitShopCartOrdersAction(
  rawLines: unknown,
  rawDeliveryMethod: unknown,
): Promise<SubmitShopCartResult> {
  const delivery = deliverySchema.safeParse(rawDeliveryMethod);
  if (!delivery.success) {
    return { ok: false, error: "Mode de livraison invalide." };
  }

  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    return { ok: false, error: "Panier vide." };
  }

  const lines: { productId: string; quantity: number; name: string }[] = [];
  for (const raw of rawLines) {
    const parsed = cartLineSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: "Panier invalide." };
    }
    const name =
      typeof raw === "object" &&
      raw !== null &&
      "name" in raw &&
      typeof (raw as { name: unknown }).name === "string"
        ? (raw as { name: string }).name
        : "Produit";
    lines.push({
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
      name,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Connexion requise." };
  }

  const failures: { productId: string; name: string; error: string }[] = [];
  let created = 0;

  for (const line of lines) {
    const { error } = await supabase.rpc("create_shop_order", {
      p_product_id: line.productId,
      p_delivery_method: delivery.data,
      p_quantity: line.quantity,
    });

    if (error) {
      failures.push({
        productId: line.productId,
        name: line.name,
        error: mapShopOrderRpcError(error),
      });
      continue;
    }
    created += 1;
  }

  if (created === 0) {
    return {
      ok: false,
      error:
        failures[0]?.error ??
        "Impossible d’envoyer la demande. Vérifiez le stock et les commandes en cours.",
    };
  }

  revalidatePath("/boutique");
  revalidatePath("/admin");
  revalidatePath("/admin/boutique");

  return {
    ok: true,
    created,
    partial: failures.length > 0,
    failures,
  };
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

  return { ok: true };
}

export async function adminUpdateShopOrderStatusAction(
  rawOrderId: unknown,
  rawStatus: unknown,
  rawAdminNote?: unknown,
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

  const { error } = await supabase.rpc("admin_update_shop_order_status", {
    p_order_id: orderId.data,
    p_status: status.data,
    p_admin_note: adminNote || null,
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
