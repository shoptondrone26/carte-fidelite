"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteShopProductAction,
  setShopProductActiveAction,
} from "@/actions/shop-products";
import { AdminProductForm } from "@/components/admin/shop/admin-product-form";
import { AdminShopOrdersSection } from "@/components/admin/shop/admin-shop-orders-section";
import { useAdminRealtimeRefetch } from "@/hooks/use-admin-realtime-refetch";
import { shopCategoryLabel } from "@/lib/boutique/categories";
import {
  fetchAdminShopOrders,
  type AdminShopOrder,
} from "@/lib/boutique/orders";
import { fetchAdminShopProducts, formatShopPrice } from "@/lib/boutique/products";
import type { ShopProduct } from "@/lib/boutique/types";
import { ADMIN_BOUTIQUE_SYNC } from "@/lib/realtime/admin-sync";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type AdminBoutiqueLiveProps = {
  initialProducts: ShopProduct[];
  initialOrders: AdminShopOrder[];
};

type PanelMode = { type: "create" } | { type: "edit"; product: ShopProduct };

export function AdminBoutiqueLive({
  initialProducts,
  initialOrders,
}: AdminBoutiqueLiveProps) {
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);
  const [panel, setPanel] = useState<PanelMode | null>(null);
  const [actionPending, startAction] = useTransition();

  useEffect(() => {
    setProducts(initialProducts);
    setOrders(initialOrders);
  }, [initialProducts, initialOrders]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const [nextProducts, nextOrders] = await Promise.all([
      fetchAdminShopProducts(supabase),
      fetchAdminShopOrders(supabase),
    ]);
    setProducts(nextProducts);
    setOrders(nextOrders);
  }, []);

  useAdminRealtimeRefetch(refetch, ADMIN_BOUTIQUE_SYNC, 400, "admin:boutique");

  function onSaved(product: ShopProduct, wasUpdate: boolean) {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx === -1) return [product, ...prev];
      const copy = [...prev];
      copy[idx] = product;
      return copy;
    });
    if (wasUpdate) {
      setPanel(null);
    } else {
      setPanel({ type: "edit", product });
    }
  }

  function toggleActive(product: ShopProduct) {
    startAction(async () => {
      const res = await setShopProductActiveAction(
        product.id,
        !product.is_active,
      );
      if (res.ok && res.product) {
        setProducts((prev) =>
          prev.map((p) => (p.id === res.product!.id ? res.product! : p)),
        );
        toast.success(
          res.product.is_active ? "Produit activé" : "Produit désactivé",
        );
      } else if (!res.ok) {
        toast.error(res.error);
      }
    });
  }

  function onDelete(product: ShopProduct) {
    if (
      !window.confirm(
        `Supprimer définitivement « ${product.name} » ? Cette action est irréversible.`,
      )
    ) {
      return;
    }

    startAction(async () => {
      const res = await deleteShopProductAction(product.id);
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        if (panel?.type === "edit" && panel.product.id === product.id) {
          setPanel(null);
        }
        toast.success("Produit supprimé");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminShopOrdersSection orders={orders} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {products.length} produit{products.length > 1 ? "s" : ""} au catalogue
        </p>
        <button
          type="button"
          onClick={() => setPanel({ type: "create" })}
          className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-xs font-bold text-black transition hover:bg-amber-200"
        >
          <Plus className="size-4" aria-hidden />
          Nouveau produit
        </button>
      </div>

      {panel ? (
        <section className="rounded-2xl border border-amber-300/20 bg-card/40 p-4 shadow-inner shadow-black/20">
          <h2 className="mb-4 text-sm font-semibold text-amber-50">
            {panel.type === "create" ? "Nouveau produit" : "Modifier le produit"}
          </h2>
          <AdminProductForm
            product={panel.type === "edit" ? panel.product : null}
            allProducts={products}
            onSaved={onSaved}
            onCancel={() => setPanel(null)}
          />
        </section>
      ) : null}

      {products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
          Aucun produit. Créez le premier article du catalogue.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card/30">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex flex-col gap-3 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shopCategoryLabel(product.category)} ·{" "}
                    {formatShopPrice(product.price_eur)} · Stock {product.stock}
                  </p>
                  <span
                    className={cn(
                      "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                      product.is_active
                        ? "bg-emerald-500/15 text-emerald-200"
                        : "bg-zinc-500/15 text-zinc-400",
                    )}
                  >
                    {product.is_active ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={actionPending}
                  onClick={() => setPanel({ type: "edit", product })}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/5"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  disabled={actionPending}
                  onClick={() => toggleActive(product)}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/5"
                >
                  {product.is_active ? "Désactiver" : "Activer"}
                </button>
                <button
                  type="button"
                  disabled={actionPending}
                  onClick={() => onDelete(product)}
                  className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/10"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
