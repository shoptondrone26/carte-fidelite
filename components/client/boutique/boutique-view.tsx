import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { BoutiqueRoadmapCard } from "@/components/client/boutique/boutique-roadmap-card";
import { buttonVariants } from "@/components/ui/button";
import { BOUTIQUE_MODULES } from "@/lib/boutique/sections";
import type { BoutiqueSnapshot } from "@/lib/boutique/types";
import { cn } from "@/lib/utils";

type BoutiqueViewProps = {
  snapshot: BoutiqueSnapshot;
};

export function BoutiqueView({ snapshot }: BoutiqueViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-amber-200/20 bg-linear-to-br from-zinc-950 via-black to-amber-950/20 p-5 shadow-2xl shadow-amber-950/25">
        <div
          aria-hidden
          className="premium-ambient pointer-events-none absolute -right-14 -top-14 size-44 rounded-full bg-amber-300/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-amber-100/55 to-transparent"
        />
        <div className="relative space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-100">
            <Sparkles className="size-3" aria-hidden />
            Ouverture prochaine
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Boutique membre
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            Produits exclusifs, commandes simplifiées et suivi premium — votre
            espace boutique ShopTonDrone Privé se prépare.
          </p>
        </div>
      </section>

      <section
        aria-label="Aperçu boutique"
        className="grid grid-cols-2 gap-2"
      >
        <MetricPill label="Produits" value={snapshot.productsCount} />
        <MetricPill label="Commandes" value={snapshot.ordersCount} />
        <MetricPill label="En cours" value={snapshot.activeOrdersCount} />
        <MetricPill label="Historique" value={snapshot.historyCount} />
      </section>

      <section className="space-y-3" aria-labelledby="boutique-modules-title">
        <div>
          <p
            id="boutique-modules-title"
            className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/75"
          >
            À venir
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Modules prêts à être branchés sur le catalogue.
          </p>
        </div>
        <ul className="grid gap-2">
          {BOUTIQUE_MODULES.map((module) => (
            <li key={module.id}>
              <BoutiqueRoadmapCard module={module} snapshot={snapshot} />
            </li>
          ))}
        </ul>
      </section>

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

function MetricPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 px-3 py-3 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-amber-50">
        {value}
      </p>
    </div>
  );
}
