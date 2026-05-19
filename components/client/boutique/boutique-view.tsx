import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BoutiqueCatalog } from "@/components/client/boutique/boutique-catalog";
import { buttonVariants } from "@/components/ui/button";
import type { ShopProduct } from "@/lib/boutique/types";
import { cn } from "@/lib/utils";

type BoutiqueViewProps = {
  products: ShopProduct[];
};

export function BoutiqueView({ products }: BoutiqueViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-2xl border border-amber-200/15 bg-linear-to-r from-amber-500/8 via-zinc-950 to-black px-4 py-3">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-amber-100/40 to-transparent"
        />
        <p className="text-sm text-zinc-400">
          Catalogue réservé aux membres — commande et paiement à venir.
        </p>
      </section>

      <BoutiqueCatalog initialProducts={products} />

      <Link
        href="/dashboard"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "h-11 w-full justify-center gap-2 border-amber-300/20 bg-black/25 text-amber-100 hover:bg-amber-300/10",
        )}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour à la Carte
      </Link>
    </div>
  );
}
