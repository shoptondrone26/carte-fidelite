"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
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

  const byId = new Map(allProducts.map((p) => [p.id, p]));
  const candidates = allProducts.filter(
    (p) => p.id !== productId && p.is_active && !selected.includes(p.id),
  );

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

  function addRecommendation(id: string) {
    setSelected((prev) => [...prev, id]);
  }

  function removeRecommendation(id: string) {
    setSelected((prev) => prev.filter((x) => x !== id));
  }

  function move(id: string, direction: -1 | 1) {
    setSelected((prev) => {
      const index = prev.indexOf(id);
      if (index < 0) return prev;
      const next = index + direction;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  }

  function onSave() {
    startTransition(async () => {
      const res = await setShopProductRecommendationsAction(productId, selected);
      if (res.ok) toast.success("Options du pack enregistrées");
      else toast.error(res.error);
    });
  }

  if (!loaded) {
    return (
      <p className="text-xs text-muted-foreground">Chargement des options…</p>
    );
  }

  return (
    <div className="space-y-3 border-t border-white/8 pt-5">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Compléter le pack (options compatibles)
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Produits proposés sur la fiche client — ordre affiché ci-dessous.
        </p>
      </div>

      {selected.length > 0 ? (
        <ul className="space-y-1.5 rounded-xl border border-amber-300/15 bg-amber-500/5 p-2">
          {selected.map((id, index) => {
            const p = byId.get(id);
            if (!p) return null;
            return (
              <li
                key={id}
                className="flex items-center gap-1 rounded-lg border border-white/8 bg-black/30 px-2 py-1.5"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-100">
                  {p.name}
                </span>
                <button
                  type="button"
                  aria-label="Monter"
                  disabled={index === 0}
                  onClick={() => move(id, -1)}
                  className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-amber-100 disabled:opacity-30"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Descendre"
                  disabled={index === selected.length - 1}
                  onClick={() => move(id, 1)}
                  className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-amber-100 disabled:opacity-30"
                >
                  <ChevronDown className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Retirer"
                  onClick={() => removeRecommendation(id)}
                  className="rounded p-1 text-zinc-400 hover:bg-rose-950/50 hover:text-rose-200"
                >
                  <X className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          Aucune option — ajoutez des produits ci-dessous.
        </p>
      )}

      {candidates.length > 0 ? (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Ajouter un produit
          </p>
          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2">
            {candidates.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => addRecommendation(p.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-zinc-200 hover:bg-white/5"
                >
                  <Plus className="size-3.5 shrink-0 text-amber-300/80" />
                  <span className="truncate">{p.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : selected.length > 0 ? null : (
        <p className="text-xs text-muted-foreground">
          Aucun autre produit actif disponible.
        </p>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={onSave}
        className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-semibold text-amber-100 disabled:opacity-50"
      >
        {pending ? "Enregistrement…" : "Enregistrer les options du pack"}
      </button>
    </div>
  );
}
