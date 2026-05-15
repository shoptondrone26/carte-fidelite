import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CycleProgress, VipLevel } from "@/lib/loyalty/vip";
import { vipLevelLabelFr } from "@/lib/loyalty/vip";

type LoyaltyCardProps = {
  displayName: string;
  vipLevel: VipLevel;
  totalUnlocks: number;
  cycle: CycleProgress;
  freeEarned: number;
  freeAvailable: number;
};

function vipBadgeClass(level: VipLevel) {
  switch (level) {
    case "or":
      return "border-amber-300/40 bg-linear-to-r from-amber-400/25 to-amber-600/20 text-amber-50";
    case "bronze":
      return "border-amber-700/40 bg-amber-950/50 text-amber-100";
    default:
      return "border-white/15 bg-white/10 text-zinc-100";
  }
}

export function LoyaltyCard({
  displayName,
  vipLevel,
  totalUnlocks,
  cycle,
  freeEarned,
  freeAvailable,
}: LoyaltyCardProps) {
  const vipLabel = vipLevelLabelFr[vipLevel];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/90 via-zinc-900 to-zinc-950 p-6 shadow-xl shadow-black/50">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-amber-400/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-14 -left-6 size-52 rounded-full bg-violet-500/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-400">
              Carte fidélité
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              {displayName}
            </h2>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider",
              vipBadgeClass(vipLevel),
            )}
          >
            VIP {vipLabel}
          </span>
        </header>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-sm">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Déblocages totaux
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-white">
              {totalUnlocks}
            </dd>
          </div>
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 backdrop-blur-sm">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-amber-200/80">
              Gratuits disponibles
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-amber-100">
              {freeAvailable}
            </dd>
            <p className="mt-1 text-[10px] text-zinc-400">
              {freeEarned} gagné{freeEarned > 1 ? "s" : ""} au total
            </p>
          </div>
        </dl>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
            <span>Cycle actuel</span>
            <span className="tabular-nums text-zinc-100">{cycle.label}</span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-black/40 ring-1 ring-inset ring-white/10"
            role="progressbar"
            aria-valuenow={cycle.current}
            aria-valuemin={0}
            aria-valuemax={cycle.max}
            aria-label={`Progression du cycle : ${cycle.label}`}
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-amber-500 via-amber-300 to-amber-400 transition-[width] duration-500"
              style={{ width: `${cycle.percent}%` }}
            />
          </div>
          <div className="flex justify-between gap-2">
            {Array.from({ length: cycle.max }, (_, i) => {
              const filled =
                i < cycle.current ||
                (cycle.justCompletedFree && i < cycle.max);
              return (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    filled ? "bg-amber-300/90" : "bg-white/10",
                  )}
                  aria-hidden
                />
              );
            })}
          </div>
        </div>

        <Link
          href="/deblocage"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "h-12 w-full justify-center border-0 bg-white text-zinc-950 shadow-lg shadow-amber-900/25 hover:bg-white/90",
          )}
        >
          Réserver une place
        </Link>
      </div>
    </section>
  );
}
