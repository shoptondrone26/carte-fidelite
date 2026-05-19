"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { upsertShopProductAction } from "@/actions/shop-products";
import { AdminProductImageUpload } from "@/components/admin/shop/admin-product-image-upload";
import {
  SHOP_CATEGORY_LABELS,
  SHOP_CATEGORY_SLUGS,
  type ShopCategorySlug,
} from "@/lib/boutique/categories";
import type { ShopProduct } from "@/lib/boutique/types";
import { cn } from "@/lib/utils";

type AdminProductFormProps = {
  product?: ShopProduct | null;
  onSaved: (product: ShopProduct) => void;
  onCancel: () => void;
};

export function AdminProductForm({
  product,
  onSaved,
  onCancel,
}: AdminProductFormProps) {
  const [pending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? null);
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [priceEur, setPriceEur] = useState(
    product ? String(product.price_eur) : "",
  );
  const [stock, setStock] = useState(product ? String(product.stock) : "0");
  const [category, setCategory] = useState<ShopCategorySlug>(
    (product?.category as ShopCategorySlug) ?? "general",
  );
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(
    product ? String(product.sort_order) : "0",
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await upsertShopProductAction({
        id: product?.id,
        name,
        description,
        price_eur: Number(priceEur),
        stock: Number(stock),
        category,
        is_active: isActive,
        sort_order: Number(sortOrder),
        image_url: imageUrl,
      });

      if (res.ok && res.product) {
        toast.success(product ? "Produit mis à jour" : "Produit créé");
        onSaved(res.product);
      } else if (!res.ok) {
        toast.error("Enregistrement impossible", { description: res.error });
      }
    });
  }

  const needsIdForImage = Boolean(product?.id);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {needsIdForImage ? (
        <AdminProductImageUpload
          productId={product!.id}
          imageUrl={imageUrl}
          onUpdated={setImageUrl}
        />
      ) : (
        <p className="rounded-xl border border-dashed border-amber-300/20 bg-amber-300/5 px-3 py-2 text-xs text-amber-100/80">
          Enregistrez le produit une première fois pour ajouter une photo.
        </p>
      )}

      <Field label="Nom">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="Nom du produit"
        />
      </Field>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={cn(inputClass, "resize-none")}
          placeholder="Description courte"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Prix (€)">
          <input
            required
            type="number"
            min={0}
            step={1}
            value={priceEur}
            onChange={(e) => setPriceEur(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Stock">
          <input
            required
            type="number"
            min={0}
            step={1}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Catégorie">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ShopCategorySlug)}
            className={inputClass}
          >
            {SHOP_CATEGORY_SLUGS.map((slug) => (
              <option key={slug} value={slug}>
                {SHOP_CATEGORY_LABELS[slug]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ordre">
          <input
            type="number"
            min={0}
            step={1}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="size-4 rounded border-white/20 accent-amber-400"
        />
        Produit actif (visible catalogue client)
      </label>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="flex-1 rounded-full border border-white/10 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-full bg-amber-300 py-2.5 text-sm font-bold text-black transition hover:bg-amber-200 disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : product ? "Mettre à jour" : "Créer"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-amber-300/40 focus:ring-1 focus:ring-amber-300/20";
