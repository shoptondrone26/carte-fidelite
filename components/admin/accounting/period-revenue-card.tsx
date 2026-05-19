import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { formatEur, type PeriodRevenueKpi } from "@/lib/admin/accounting";
import { cn } from "@/lib/utils";

type PeriodRevenueCardProps = {
  title: string;
  period: PeriodRevenueKpi;
  accent?: "amber" | "violet" | "emerald" | "zinc";
  compareLabel?: string;
};

export function PeriodRevenueCard({
  title,
  period,
  accent = "amber",
  compareLabel = "vs période préc.",
}: PeriodRevenueCardProps) {
  const ring =
    accent === "amber"
      ? "border-amber-500/30 shadow-[0_0_28px_rgba(245,158,11,0.08)]"
      : accent === "violet"
        ? "border-violet-500/30 shadow-[0_0_28px_rgba(167,139,250,0.08)]"
        : accent === "emerald"
          ? "border-emerald-500/30 shadow-[0_0_28px_rgba(52,211,153,0.08)]"
          : "border-white/10";

  const trend =
    period.changePercent === null
      ? period.total > 0
        ? "up"
        : "flat"
      : period.changePercent > 0
        ? "up"
        : period.changePercent < 0
          ? "down"
          : "flat";

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-linear-to-br from-zinc-950 via-card/60 to-black p-4 shadow-inner shadow-black/25",
        ring,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-amber-100/40 to-transparent"
      />
      <header className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/75">
          {title}
        </p>
        <TrendHint
          trend={trend}
          changePercent={period.changePercent}
          compareLabel={compareLabel}
        />
      </header>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-white">
        {formatEur(period.total)}
      </p>
      <ul className="mt-3 space-y-1.5 border-t border-white/8 pt-3 text-xs text-zinc-400">
        <BreakdownLine label="Déblocages" amount={period.unlocks} />
        <BreakdownLine label="Mode Fantôme" amount={period.phantom} />
        <BreakdownLine
          label="Boutique"
          amount={period.shop}
          muted={period.shop === 0}
        />
      </ul>
    </article>
  );
}

function BreakdownLine({
  label,
  amount,
  muted = false,
}: {
  label: string;
  amount: number;
  muted?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className={muted ? "text-zinc-600" : undefined}>{label}</span>
      <span
        className={cn(
          "tabular-nums font-medium",
          muted ? "text-zinc-600" : "text-zinc-200",
        )}
      >
        {amount !== 0 ? formatEur(amount) : "—"}
      </span>
    </li>
  );
}

function TrendHint({
  trend,
  changePercent,
  compareLabel,
}: {
  trend: "up" | "down" | "flat";
  changePercent: number | null;
  compareLabel: string;
}) {
  const Icon =
    trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;
  const tone =
    trend === "up"
      ? "text-emerald-400/90"
      : trend === "down"
        ? "text-rose-400/90"
        : "text-zinc-500";

  return (
    <span
      className={cn(
        "inline-flex max-w-[45%] flex-col items-end gap-0.5 text-right",
        tone,
      )}
      title={compareLabel}
    >
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium">
        <Icon className="size-3 shrink-0" aria-hidden />
        {changePercent !== null ? (
          <span className="tabular-nums">
            {changePercent > 0 ? "+" : ""}
            {changePercent}%
          </span>
        ) : trend === "up" ? (
          <span>nouveau</span>
        ) : (
          <span className="text-zinc-600">—</span>
        )}
      </span>
    </span>
  );
}
