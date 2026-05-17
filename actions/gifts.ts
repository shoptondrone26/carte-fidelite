"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getIsAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid();
const giftStatusSchema = z.enum(["accepted", "refused", "sent", "cancelled"]);
const giftRaritySchema = z.enum(["rare", "premium", "elite", "legendary"]);

export type GiftActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export async function redeemGiftAction(rawGiftId: unknown): Promise<GiftActionResult> {
  const parsed = uuidSchema.safeParse(rawGiftId);
  if (!parsed.success) {
    return { ok: false, error: "Cadeau invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Vous devez être connecté." };
  }

  const { data, error } = await supabase.rpc("redeem_gift", {
    p_gift_id: parsed.data,
  });

  if (error) {
    if (error.message.includes("insufficient_points")) {
      return { ok: false, error: "Solde de points insuffisant." };
    }
    if (error.message.includes("gift_not_found")) {
      return { ok: false, error: "Ce cadeau n’est plus disponible." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/cadeaux");

  return { ok: true, id: String(data) };
}

export async function updateGiftRequestAction(
  rawRequestId: unknown,
  rawStatus: unknown,
  rawTrackingNumber?: unknown,
  rawAdminNote?: unknown,
): Promise<GiftActionResult> {
  const parsedId = uuidSchema.safeParse(rawRequestId);
  const parsedStatus = giftStatusSchema.safeParse(rawStatus);
  if (!parsedId.success || !parsedStatus.success) {
    return { ok: false, error: "Demande cadeau invalide." };
  }

  const trackingNumber =
    typeof rawTrackingNumber === "string" ? rawTrackingNumber.trim() : "";
  const adminNote = typeof rawAdminNote === "string" ? rawAdminNote.trim() : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await getIsAdmin(supabase, user.id))) {
    return { ok: false, error: "Accès réservé aux administrateurs." };
  }

  const { error } = await supabase.rpc("admin_update_gift_request", {
    p_request_id: parsedId.data,
    p_status: parsedStatus.data,
    p_tracking_number: trackingNumber || null,
    p_admin_note: adminNote || null,
  });

  if (error) {
    if (error.message.includes("already_final")) {
      return { ok: false, error: "Cette demande est déjà clôturée." };
    }
    if (error.message.includes("forbidden")) {
      return { ok: false, error: "Action non autorisée." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/cadeaux");
  revalidatePath("/dashboard");
  revalidatePath("/admin/clients");

  return { ok: true };
}

export async function upsertGiftAction(formData: FormData): Promise<GiftActionResult> {
  const idRaw = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const rarity = String(formData.get("rarity") ?? "rare");
  const active = formData.get("active") === "on";
  const pointsPrice = Number(formData.get("points_price") ?? 0);
  const realCostEur = Number(formData.get("real_cost_eur") ?? 0);
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  const parsedId = idRaw ? uuidSchema.safeParse(idRaw) : null;
  const parsedRarity = giftRaritySchema.safeParse(rarity);

  if (
    (parsedId && !parsedId.success) ||
    !parsedRarity.success ||
    !name ||
    !description ||
    !Number.isInteger(pointsPrice) ||
    pointsPrice <= 0 ||
    !Number.isInteger(realCostEur) ||
    realCostEur < 0 ||
    !Number.isInteger(sortOrder)
  ) {
    return { ok: false, error: "Paramètres cadeau invalides." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await getIsAdmin(supabase, user.id))) {
    return { ok: false, error: "Accès réservé aux administrateurs." };
  }

  const { data, error } = await supabase.rpc("admin_upsert_gift", {
    p_id: parsedId?.success ? parsedId.data : null,
    p_name: name,
    p_description: description,
    p_points_price: pointsPrice,
    p_real_cost_eur: realCostEur,
    p_image_url: imageUrl || null,
    p_rarity: parsedRarity.data,
    p_active: active,
    p_sort_order: sortOrder,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/cadeaux");
  revalidatePath("/dashboard");

  return { ok: true, id: String(data) };
}

