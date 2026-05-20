import type { CycleProgress, VipLevel } from "@/lib/loyalty/vip";
import { vipLevelLabelFr } from "@/lib/loyalty/vip";
import { cn } from "@/lib/utils";

type LoyaltyCardProps = {
  userId: string;
  vipLevel: VipLevel;
  totalUnlocks: number;
  cycle: CycleProgress;
  freeEarned: number;
  freeAvailable: number;
};

function vipBadgeClass(level: VipLevel) {
  switch (level) {
    case "or":
      return "border-amber-200/40 bg-amber-300/12 text-amber-50";
    case "bronze":
      return "border-amber-700/35 bg-amber-950/50 text-amber-100";
    default:
      return "border-white/12 bg-white/6 text-zinc-200";
  }
}

function loyaltyProgressMessage(
  cycle: CycleProgress,
  freeAvailable: number,
): string {
  if (freeAvailable > 0) {
    return "Gratuit disponible";
  }
  if (cycle.justCompletedFree) {
    return "Prochain gratuit à activer";
  }

  const remaining = Math.max(cycle.max - cycle.current, 0);
  if (remaining <= 1) {
    return "Encore 1 déblocage avant votre gratuit";
  }
  return `Encore ${remaining} déblocages avant votre gratuit`;
}

export function LoyaltyCard({
  userId,
  vipLevel,
  totalUnlocks,
  cycle,
  freeEarned,
  freeAvailable,
}: LoyaltyCardProps) {
  const vipLabel = vipLevelLabelFr[vipLevel];
  const memberNumber = `STP-${userId.slice(0, 2).toUpperCase()}••••${userId.slice(-4).toUpperCase()}`;
  const progressMessage = loyaltyProgressMessage(cycle, freeAvailable);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-amber-100/12 bg-linear-to-br from-zinc-900/95 via-zinc-950 to-black p-4 shadow-xl shadow-black/50">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-amber-300/10 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-amber-100/50 to-transparent"
      />

      <div className="relative space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            {memberNumber}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em]",
              vipBadgeClass(vipLevel),
            )}
          >
            VIP {vipLabel}
          </span>
        </div>

        <div className="flex items-end justify-between gap-4 border-y border-white/8 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Déblocages
            </p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums text-white">
              {totalUnlocks}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/65">
              Gratuits
            </p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums text-amber-50">
              {freeAvailable}
              <span className="ml-1 text-[10px] font-medium text-zinc-500">
                / {freeEarned} gagné{freeEarned > 1 ? "s" : ""}
              </span>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold leading-snug text-amber-50/95">
            {progressMessage}
          </p>
          <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
            <span>Progression</span>
            <span className="tabular-nums text-amber-100/80">{cycle.label}</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-black/50 ring-1 ring-inset ring-white/8"
            role="progressbar"
            aria-valuenow={cycle.current}
            aria-valuemin={0}
            aria-valuemax={cycle.max}
            aria-label={`Progression fidélité : ${cycle.label}`}
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-amber-700 via-amber-200 to-amber-50 transition-[width] duration-700 shadow-[0_0_12px_rgba(251,191,36,0.28)]"
              style={{ width: `${cycle.percent}%` }}
            />
          </div>
          <div className="flex justify-between gap-1.5">
            {Array.from({ length: cycle.max }, (_, i) => {
              const filled =
                i < cycle.current ||
                (cycle.justCompletedFree && i < cycle.max);
              return (
                <span
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    filled
                      ? "bg-amber-200/90 shadow-[0_0_8px_rgba(251,191,36,0.2)]"
                      : "bg-white/8",
                  )}
                  aria-hidden
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
