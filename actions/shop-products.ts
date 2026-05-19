"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { SHOP_CATEGORY_SLUGS } from "@/lib/boutique/categories";
import { mapShopProduct } from "@/lib/boutique/products";
import type { ShopProduct } from "@/lib/boutique/types";
import { getIsAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const productIdSchema = z.string().uuid();

const productInputSchema = z.object({
  name: z.string().trim().min(1, "Nom requis."),
  description: z.string().trim().optional(),
  price_eur: z.coerce.number().min(0, "Prix invalide."),
  stock: z.coerce.number().int().min(0, "Stock invalide."),
  category: z.enum(SHOP_CATEGORY_SLUGS),
  is_active: z.coerce.boolean(),
  sort_order: z.coerce.number().int().min(0).optional(),
  image_url: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (!v || v === "" ? null : v)),
});

export type ShopProductActionResult =
  | { ok: true; product?: ShopProduct }
  | { ok: false; error: string };

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Connexion requise.", supabase: null };
  }

  if (!(await getIsAdmin(supabase, user.id))) {
    return { ok: false as const, error: "Accès admin requis.", supabase: null };
  }

  return { ok: true as const, supabase, user };
}

function revalidateShopPaths() {
  revalidatePath("/admin/boutique");
  revalidatePath("/boutique");
}

export async function upsertShopProductAction(
  input: z.infer<typeof productInputSchema> & { id?: string },
): Promise<ShopProductActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const payload = {
    name: parsed.data.name,
    description: parsed.data.description?.length
      ? parsed.data.description
      : null,
    price_eur: parsed.data.price_eur,
    stock: parsed.data.stock,
    category: parsed.data.category,
    is_active: parsed.data.is_active,
    sort_order: parsed.data.sort_order ?? 0,
    image_url: parsed.data.image_url ?? null,
  };

  if (input.id) {
    const idParsed = productIdSchema.safeParse(input.id);
    if (!idParsed.success) {
      return { ok: false, error: "Identifiant produit invalide." };
    }

    const { data, error } = await auth.supabase
      .from("shop_products")
      .update(payload)
      .eq("id", idParsed.data)
      .select(
        "id, name, description, price_eur, stock, image_url, category, is_active, sort_order, created_at, updated_at",
      )
      .single();

    if (error) return { ok: false, error: error.message };
    revalidateShopPaths();
    return { ok: true, product: mapShopProduct(data) };
  }

  const { data, error } = await auth.supabase
    .from("shop_products")
    .insert(payload)
    .select(
      "id, name, description, price_eur, stock, image_url, category, is_active, sort_order, created_at, updated_at",
    )
    .single();

  if (error) return { ok: false, error: error.message };
  revalidateShopPaths();
  return { ok: true, product: mapShopProduct(data) };
}

export async function setShopProductActiveAction(
  productId: string,
  isActive: boolean,
): Promise<ShopProductActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const idParsed = productIdSchema.safeParse(productId);
  if (!idParsed.success) {
    return { ok: false, error: "Identifiant produit invalide." };
  }

  const { data, error } = await auth.supabase
    .from("shop_products")
    .update({ is_active: isActive })
    .eq("id", idParsed.data)
    .select(
      "id, name, description, price_eur, stock, image_url, category, is_active, sort_order, created_at, updated_at",
    )
    .single();

  if (error) return { ok: false, error: error.message };
  revalidateShopPaths();
  return { ok: true, product: mapShopProduct(data) };
}

export async function deleteShopProductAction(
  productId: string,
): Promise<ShopProductActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const idParsed = productIdSchema.safeParse(productId);
  if (!idParsed.success) {
    return { ok: false, error: "Identifiant produit invalide." };
  }

  const { error } = await auth.supabase
    .from("shop_products")
    .delete()
    .eq("id", idParsed.data);

  if (error) return { ok: false, error: error.message };
  revalidateShopPaths();
  return { ok: true };
}

export async function updateShopProductImageAction(
  productId: string,
  imageUrl: string | null,
): Promise<ShopProductActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const idParsed = productIdSchema.safeParse(productId);
  if (!idParsed.success) {
    return { ok: false, error: "Identifiant produit invalide." };
  }

  const { data, error } = await auth.supabase
    .from("shop_products")
    .update({ image_url: imageUrl })
    .eq("id", idParsed.data)
    .select(
      "id, name, description, price_eur, stock, image_url, category, is_active, sort_order, created_at, updated_at",
    )
    .single();

  if (error) return { ok: false, error: error.message };
  revalidateShopPaths();
  return { ok: true, product: mapShopProduct(data) };
}
