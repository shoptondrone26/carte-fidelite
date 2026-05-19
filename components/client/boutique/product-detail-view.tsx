"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { ProductGallery } from "@/components/client/boutique/product-gallery";
import { ProductRecommendations } from "@/components/client/boutique/product-recommendations";
import { ShopCartTrigger } from "@/components/client/boutique/shop-cart-trigger";
import { buttonVariants } from "@/components/ui/button";
import { useShopCart, useShopCartUi } from "@/lib/boutique/cart";
import { shopCategoryLabel } from "@/lib/boutique/categories";
import { productImageUrls } from "@/lib/boutique/images";
import { formatShopPrice } from "@/lib/boutique/products";
import type { ShopProduct } from "@/lib/boutique/types";
import { cn } from "@/lib/utils";

type ProductDetailViewProps = {
  product: ShopProduct;
  recommendations: ShopProduct[];
};

export function ProductDetailView({
  product,
  recommendations,
}: ProductDetailViewProps) {
  const { addProduct, getQuantity } = useShopCart();
  const { openCart } = useShopCartUi();
  const [addedFlash, setAddedFlash] = useState(false);
  const outOfStock = product.stock <= 0;
  const qtyInCart = getQuantity(product.id);
  const images = productImageUrls(product);

  function onAddToCart() {
    if (outOfStock) return;
    const ok = addProduct(product, 1);
    if (ok) {
      setAddedFlash(true);
      toast.success("Ajouté au panier", { description: product.name });
      window.setTimeout(() => setAddedFlash(false), 1200);
    } else {
      toast.message("Stock maximum atteint");
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-8 pb-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/boutique"
          className="inline-flex w-fit items-center gap-2 text-xs font-semibold text-amber-200/80 transition hover:text-amber-100"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Boutique
        </Link>
        <ShopCartTrigger />
      </div>

      <div className="grid min-w-0 gap-8 lg:grid-cols-2 lg:gap-10">
        <ProductGallery images={images} productName={product.name} />

        <div className="flex min-w-0 flex-col gap-5">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-200/75">
              {shopCategoryLabel(product.category)}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {product.name}
            </h1>
            <p className="text-2xl font-semibold tabular-nums text-amber-50">
              {formatShopPrice(product.price_eur)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AvailabilityBadge outOfStock={outOfStock} stock={product.stock} />
            {qtyInCart > 0 ? (
              <button
                type="button"
                onClick={openCart}
                className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-100 hover:bg-amber-500/20"
              >
                {qtyInCart} au panier
              </button>
            ) : null}
          </div>

          {product.description ? (
            <div className="space-y-2 rounded-2xl border border-white/8 bg-black/30 px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                Description
              </p>
              <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          ) : null}

          {product.specs ? (
            <div className="space-y-2 rounded-2xl border border-white/8 bg-black/30 px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                Caractéristiques
              </p>
              <p className="text-sm leading-relaxed text-zinc-400 whitespace-pre-wrap">
                {product.specs}
              </p>
            </div>
          ) : null}

          <button
            type="button"
            disabled={outOfStock}
            onClick={onAddToCart}
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "h-12 w-full justify-center gap-2 bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-45",
              addedFlash && "scale-[0.98] ring-2 ring-amber-300/50",
            )}
          >
            <ShoppingBag className="size-4" aria-hidden />
            {outOfStock ? "Rupture" : "Ajouter au panier"}
          </button>

          <p className="text-center text-[11px] text-zinc-500">
            Paiement manuel sur Snapchat après envoi de la demande
          </p>
        </div>
      </div>

      {recommendations.length > 0 ? (
        <ProductRecommendations
          products={recommendations}
          currentProductId={product.id}
        />
      ) : null}
    </div>
  );
}

function AvailabilityBadge({
  outOfStock,
  stock,
}: {
  outOfStock: boolean;
  stock: number;
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
        outOfStock
          ? "border-rose-400/40 bg-rose-950/60 text-rose-100"
          : "border-emerald-400/35 bg-emerald-950/60 text-emerald-100",
      )}
    >
      {outOfStock ? "Rupture" : `Disponible · ${stock} en stock`}
    </span>
  );
}
