"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { setShopProductRecommendationsAction } from "@/actions/shop-products";
import { fetchRecommendationIds } from "@/lib/boutique/recommendations";
import type { ShopProduct } from "@/lib/boutique/types";
import { createClient } from "@/lib/supabase/client";

type AdminProductRecommendationsProps = {
  productId: string;
  allProducts: ShopProduct[];
};

export function AdminProductRecommendations({
  productId,
  allProducts,
}: AdminProductRecommendationsProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, startTransition] = useTransition();

  const candidates = allProducts.filter((p) => p.id !== productId && p.is_active);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const ids = await fetchRecommendationIds(supabase, productId);
      if (!cancelled) {
        setSelected(ids);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function onSave() {
    startTransition(async () => {
      const res = await setShopProductRecommendationsAction(productId, selected);
      if (res.ok) toast.success("Recommandations enregistrées");
      else toast.error(res.error);
    });
  }

  if (!loaded) {
    return (
      <p className="text-xs text-muted-foreground">Chargement des recommandations…</p>
    );
  }

  return (
    <div className="space-y-3 border-t border-white/8 pt-5">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Souvent acheté avec
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Produits suggérés sous la fiche client.
        </p>
      </div>
      {candidates.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Aucun autre produit actif disponible.
        </p>
      ) : (
        <ul className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2">
          {candidates.map((p) => (
            <li key={p.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={() => toggle(p.id)}
                  className="size-4 rounded accent-amber-400"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                  {p.name}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={onSave}
        className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-semibold text-amber-100 disabled:opacity-50"
      >
        {pending ? "Enregistrement…" : "Enregistrer les recommandations"}
      </button>
    </div>
  );
}
