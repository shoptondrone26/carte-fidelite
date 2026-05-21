"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { SHOP_CATEGORY_SLUGS } from "@/lib/boutique/categories";
import { MAX_PRODUCT_IMAGES } from "@/lib/boutique/images";
import { mapShopProduct } from "@/lib/boutique/products";
import type { ShopProduct } from "@/lib/boutique/types";
import { getIsAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const productIdSchema = z.string().uuid();

const productInputSchema = z.object({
  name: z.string().trim().min(1, "Nom requis."),
  short_description: z.string().trim().optional(),
  description: z.string().trim().optional(),
  specs: z.string().trim().optional(),
  price_eur: z.coerce.number().min(0, "Prix invalide."),
  stock: z.coerce.number().int().min(0, "Stock invalide."),
  category: z.enum(SHOP_CATEGORY_SLUGS),
  is_active: z.coerce.boolean(),
  sort_order: z.coerce.number().int().min(0).optional(),
  image_url: z.union([z.string().url(), z.literal(""), z.null()]).nullish(),
  image_urls: z
    .array(z.string().url())
    .max(MAX_PRODUCT_IMAGES)
    .optional(),
  primary_image_index: z.coerce.number().int().min(0).max(2).optional(),
});

const SELECT =
  "id, name, short_description, description, specs, price_eur, stock, image_url, image_urls, primary_image_index, category, is_active, sort_order, created_at, updated_at";

export type ShopProductActionResult =
  | { ok: true; product?: ShopProduct; archived?: boolean; hardDeleted?: boolean }
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
  revalidatePath("/boutique", "layout");
}

function emptyToNull(s: string | undefined): string | null {
  return s?.length ? s : null;
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

  const payload: Record<string, unknown> = {
    name: parsed.data.name,
    short_description: emptyToNull(parsed.data.short_description),
    description: emptyToNull(parsed.data.description),
    specs: emptyToNull(parsed.data.specs),
    price_eur: parsed.data.price_eur,
    stock: parsed.data.stock,
    category: parsed.data.category,
    is_active: parsed.data.is_active,
    sort_order: parsed.data.sort_order ?? 0,
  };

  if (parsed.data.image_urls !== undefined) {
    payload.image_urls = parsed.data.image_urls;
    payload.primary_image_index = parsed.data.primary_image_index ?? 0;
  } else if (parsed.data.image_url != null && parsed.data.image_url !== "") {
    payload.image_urls = [parsed.data.image_url];
    payload.primary_image_index = 0;
  }

  if (input.id) {
    const idParsed = productIdSchema.safeParse(input.id);
    if (!idParsed.success) {
      return { ok: false, error: "Identifiant produit invalide." };
    }

    const { data, error } = await auth.supabase
      .from("shop_products")
      .update(payload)
      .eq("id", idParsed.data)
      .select(SELECT)
      .single();

    if (error) return { ok: false, error: error.message };
    revalidateShopPaths();
    return { ok: true, product: mapShopProduct(data) };
  }

  const { data, error } = await auth.supabase
    .from("shop_products")
    .insert({
      ...payload,
      image_urls: payload.image_urls ?? [],
      primary_image_index: payload.primary_image_index ?? 0,
    })
    .select(SELECT)
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
    .select(SELECT)
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

  const { data, error } = await auth.supabase.rpc("admin_delete_shop_product", {
    p_product_id: idParsed.data,
  });

  if (error) return { ok: false, error: error.message };

  const result = data as { archived?: boolean; hard_deleted?: boolean } | null;
  const archived = result?.archived === true;

  if (archived) {
    const { data: row, error: fetchError } = await auth.supabase
      .from("shop_products")
      .select(SELECT)
      .eq("id", idParsed.data)
      .single();

    if (fetchError) return { ok: false, error: fetchError.message };
    revalidateShopPaths();
    return { ok: true, archived: true, product: mapShopProduct(row) };
  }

  revalidateShopPaths();
  return { ok: true, hardDeleted: true };
}

export async function updateShopProductImagesAction(
  productId: string,
  imageUrls: string[],
  primaryImageIndex: number,
): Promise<ShopProductActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const idParsed = productIdSchema.safeParse(productId);
  if (!idParsed.success) {
    return { ok: false, error: "Identifiant produit invalide." };
  }

  if (imageUrls.length > MAX_PRODUCT_IMAGES) {
    return { ok: false, error: "Maximum 3 photos par produit." };
  }

  const { data, error } = await auth.supabase
    .from("shop_products")
    .update({
      image_urls: imageUrls,
      primary_image_index: primaryImageIndex,
    })
    .eq("id", idParsed.data)
    .select(SELECT)
    .single();

  if (error) return { ok: false, error: error.message };
  revalidateShopPaths();
  return { ok: true, product: mapShopProduct(data) };
}

/** @deprecated Utiliser updateShopProductImagesAction */
export async function updateShopProductImageAction(
  productId: string,
  imageUrl: string | null,
): Promise<ShopProductActionResult> {
  return updateShopProductImagesAction(
    productId,
    imageUrl ? [imageUrl] : [],
    0,
  );
}

export async function setShopProductRecommendationsAction(
  productId: string,
  recommendedProductIds: string[],
): Promise<ShopProductActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const idParsed = productIdSchema.safeParse(productId);
  if (!idParsed.success) {
    return { ok: false, error: "Identifiant produit invalide." };
  }

  const unique = [
    ...new Set(
      recommendedProductIds.filter((id) => id !== idParsed.data),
    ),
  ];

  for (const id of unique) {
    if (!productIdSchema.safeParse(id).success) {
      return { ok: false, error: "Recommandation invalide." };
    }
  }

  const { error: delError } = await auth.supabase
    .from("shop_product_recommendations")
    .delete()
    .eq("product_id", idParsed.data);

  if (delError) return { ok: false, error: delError.message };

  if (unique.length > 0) {
    const { error: insError } = await auth.supabase
      .from("shop_product_recommendations")
      .insert(
        unique.map((recommended_product_id, index) => ({
          product_id: idParsed.data,
          recommended_product_id,
          sort_order: index,
        })),
      );

    if (insError) return { ok: false, error: insError.message };
  }

  revalidateShopPaths();
  revalidatePath(`/boutique/produit/${idParsed.data}`);

  const { data } = await auth.supabase
    .from("shop_products")
    .select(SELECT)
    .eq("id", idParsed.data)
    .single();

  return { ok: true, product: data ? mapShopProduct(data) : undefined };
}
