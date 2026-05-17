import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CycleProgress, VipLevel } from "@/lib/loyalty/vip";
import { vipLevelLabelFr } from "@/lib/loyalty/vip";

type LoyaltyCardProps = {
  userId: string;
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
      return "border-amber-200/45 bg-linear-to-r from-amber-200/25 via-amber-500/14 to-white/10 text-amber-50 shadow-[0_0_28px_rgba(251,191,36,0.18)]";
    case "bronze":
      return "border-amber-700/40 bg-linear-to-r from-amber-950/70 to-amber-800/18 text-amber-100";
    default:
      return "border-white/15 bg-white/8 text-zinc-100";
  }
}

function loyaltyProgressMessage(
  cycle: CycleProgress,
  freeAvailable: number,
): string {
  if (freeAvailable > 0) {
    return "Avantage prêt à être utilisé";
  }
  if (cycle.justCompletedFree) {
    return "Prochain avantage disponible";
  }

  const remaining = Math.max(cycle.max - cycle.current, 0);
  if (remaining <= 1) {
    return "Encore 1 déblocage avant votre prochain avantage";
  }
  return `Encore ${remaining} déblocages avant votre prochain avantage`;
}

export function LoyaltyCard({
  userId,
  displayName,
  vipLevel,
  totalUnlocks,
  cycle,
  freeEarned,
  freeAvailable,
}: LoyaltyCardProps) {
  const vipLabel = vipLevelLabelFr[vipLevel];
  const memberNumber = `STP-${userId.slice(0, 2).toUpperCase()}••••${userId.slice(-4).toUpperCase()}`;
  const progressMessage = loyaltyProgressMessage(cycle, freeAvailable);
  const rarity =
    vipLevel === "or"
      ? "Membre signature"
      : vipLevel === "bronze"
        ? "Membre confirmé"
        : "Membre privé";

  return (
    <section className="premium-float relative overflow-hidden rounded-[2rem] border border-amber-100/15 bg-linear-to-br from-zinc-900/95 via-zinc-950 to-black p-5 shadow-2xl shadow-black/65">
      <div
        aria-hidden
        className="premium-ambient pointer-events-none absolute -right-14 -top-16 size-52 rounded-full bg-amber-300/16 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 size-60 rounded-full bg-violet-400/8 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-size-[18px_18px] opacity-[0.045]"
      />
      <div
        aria-hidden
        className="premium-sheen pointer-events-none absolute inset-y-[-15%] left-0 w-28 bg-linear-to-r from-transparent via-white/12 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-amber-100/60 to-transparent"
      />

      <div className="relative flex flex-col gap-5">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-400">
              Wallet privé
            </p>
            <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white">
              {displayName}
            </h2>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              {memberNumber}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] backdrop-blur-xl",
              vipBadgeClass(vipLevel),
            )}
          >
            VIP {vipLabel}
          </span>
        </header>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Membre depuis
            </p>
            <p className="mt-1 font-semibold text-zinc-100">2026</p>
          </div>
          <div className="rounded-2xl border border-amber-200/18 bg-amber-300/8 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <p className="text-[10px] uppercase tracking-[0.22em] text-amber-200/70">
              Rareté
            </p>
            <p className="mt-1 font-semibold text-amber-50">{rarity}</p>
          </div>
        </div>

        <dl className="grid grid-cols-[0.9fr_1.1fr] gap-3 text-sm">
          <div className="rounded-[1.35rem] border border-white/10 bg-black/35 px-4 py-3 shadow-inner shadow-white/5 backdrop-blur-sm">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Déblocages
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-white">
              {totalUnlocks}
            </dd>
          </div>
          <div className="relative overflow-hidden rounded-[1.35rem] border border-amber-200/25 bg-linear-to-br from-amber-300/16 via-amber-500/8 to-black px-4 py-3 shadow-[0_0_30px_rgba(245,158,11,0.10),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-sm">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-amber-200/14 blur-2xl"
            />
            <div className="relative">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-amber-100/75">
                Gratuits
              </dt>
              <dd className="mt-0.5 flex items-end gap-2">
                <span className="text-3xl font-semibold leading-none tabular-nums text-amber-50">
                  {freeAvailable}
                </span>
                <span className="pb-0.5 text-[10px] uppercase tracking-[0.18em] text-amber-100/65">
                  dispo
                </span>
              </dd>
              <p className="mt-1.5 text-[10px] text-zinc-400">
                {freeEarned} gagné{freeEarned > 1 ? "s" : ""} au total
              </p>
            </div>
          </div>
        </dl>

        <div className="space-y-2.5 rounded-[1.35rem] border border-white/10 bg-black/25 px-4 py-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold leading-snug text-amber-50">
              {progressMessage}
            </p>
            <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
              <span className="uppercase tracking-[0.2em] text-zinc-500">
                Progression fidélité
              </span>
              <span className="tabular-nums text-amber-100">{cycle.label}</span>
            </div>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-black/50 ring-1 ring-inset ring-white/10"
            role="progressbar"
            aria-valuenow={cycle.current}
            aria-valuemin={0}
            aria-valuemax={cycle.max}
            aria-label={`Progression du cycle : ${cycle.label}`}
          >
            <div
              className="premium-shimmer h-full rounded-full bg-linear-to-r from-amber-700 via-amber-200 to-white transition-[width] duration-700 shadow-[0_0_18px_rgba(251,191,36,0.34)]"
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
                    filled
                      ? "bg-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.22)]"
                      : "bg-white/8",
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
            "h-11 w-full justify-center rounded-2xl border-0 bg-white text-zinc-950 shadow-lg shadow-amber-900/25 transition duration-500 hover:bg-white/90 active:scale-[0.99]",
          )}
        >
          Réserver une place
        </Link>
      </div>
    </section>
  );
}
