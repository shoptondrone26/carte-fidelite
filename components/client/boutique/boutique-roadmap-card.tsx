import type { BoutiqueModule } from "@/lib/boutique/sections";
import type { BoutiqueSnapshot } from "@/lib/boutique/types";
import { cn } from "@/lib/utils";

type BoutiqueRoadmapCardProps = {
  module: BoutiqueModule;
  snapshot: BoutiqueSnapshot;
};

export function BoutiqueRoadmapCard({
  module,
  snapshot,
}: BoutiqueRoadmapCardProps) {
  const Icon = module.icon;
  const metric = module.metricValue(snapshot);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-black/35 p-4",
        "transition duration-500",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-amber-100/25 to-transparent opacity-0 transition duration-500 group-hover:opacity-100"
      />
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-300/10 text-amber-100">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-white">
              {module.title}
            </h3>
            <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium tabular-nums text-zinc-400">
              {metric} {module.metricLabel.toLowerCase()}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            {module.description}
          </p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/60">
            Bientôt
          </p>
        </div>
      </div>
    </article>
  );
}
