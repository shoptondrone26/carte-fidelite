"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { useShopCart } from "@/lib/boutique/cart";
import { productPrimaryImage } from "@/lib/boutique/images";
import { formatShopPrice } from "@/lib/boutique/products";
import type { ShopProduct } from "@/lib/boutique/types";
import { cn } from "@/lib/utils";

type ProductRecommendationsProps = {
  products: ShopProduct[];
  currentProductId: string;
};

export function ProductRecommendations({
  products,
  currentProductId,
}: ProductRecommendationsProps) {
  const { addProduct } = useShopCart();
  const items = products.filter((p) => p.id !== currentProductId);

  if (items.length === 0) return null;

  return (
    <section className="min-w-0 space-y-4 border-t border-white/8 pt-8">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-200/75">
        Souvent acheté avec
      </h2>
      <ul className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((product) => (
          <li key={product.id} className="w-36 shrink-0 sm:w-40">
            <RecommendationCard
              product={product}
              onAdd={() => {
                if (product.stock <= 0) {
                  toast.error("Produit en rupture");
                  return;
                }
                const ok = addProduct(product);
                if (ok) {
                  toast.success("Ajouté au panier", {
                    description: product.name,
                  });
                }
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecommendationCard({
  product,
  onAdd,
}: {
  product: ShopProduct;
  onAdd: () => void;
}) {
  const image = productPrimaryImage(product);
  const outOfStock = product.stock <= 0;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-linear-to-b from-zinc-900/90 to-black/80">
      <Link
        href={`/boutique/produit/${product.id}`}
        className="relative aspect-square overflow-hidden bg-zinc-900"
      >
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            unoptimized
            className="object-cover"
            sizes="160px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[8px] uppercase tracking-widest text-zinc-600">
            STD
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <Link href={`/boutique/produit/${product.id}`}>
          <p className="line-clamp-2 text-xs font-medium leading-snug text-white">
            {product.name}
          </p>
        </Link>
        <p className="text-sm font-semibold tabular-nums text-amber-50">
          {formatShopPrice(product.price_eur)}
        </p>
        <button
          type="button"
          disabled={outOfStock}
          onClick={onAdd}
          className={cn(
            "mt-auto flex h-8 w-full items-center justify-center gap-1 rounded-lg bg-amber-400/95 text-[10px] font-bold text-black transition hover:bg-amber-300 disabled:opacity-40",
          )}
        >
          <Plus className="size-3" aria-hidden />
          {outOfStock ? "Rupture" : "Ajouter aussi"}
        </button>
      </div>
    </article>
  );
}
