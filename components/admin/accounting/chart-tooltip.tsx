"use client";

import { formatEur } from "@/lib/admin/accounting";
import { CHART_COLORS } from "@/components/admin/accounting/chart-theme";

type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: { value?: number; name?: string; color?: string }[];
  valueSuffix?: string;
  formatValue?: (n: number) => string;
};

export function ChartTooltip({
  active,
  label,
  payload,
  valueSuffix = "€",
  formatValue = (n) => formatEur(n),
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-xl border px-3 py-2 text-xs shadow-xl"
      style={{
        background: CHART_COLORS.tooltipBg,
        borderColor: CHART_COLORS.tooltipBorder,
      }}
    >
      {label ? (
        <p className="mb-1 font-medium text-zinc-200">{label}</p>
      ) : null}
      {payload.map((entry) => (
        <p
          key={entry.name ?? "value"}
          className="tabular-nums text-amber-200"
          style={{ color: entry.color ?? CHART_COLORS.amber }}
        >
          {formatValue(entry.value ?? 0)}
          {valueSuffix === "€" ? "" : ` ${valueSuffix}`}
        </p>
      ))}
    </div>
  );
}

export function CountTooltip({
  active,
  label,
  payload,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const count = payload[0]?.value ?? 0;

  return (
    <div
      className="rounded-xl border px-3 py-2 text-xs shadow-xl"
      style={{
        background: CHART_COLORS.tooltipBg,
        borderColor: CHART_COLORS.tooltipBorder,
      }}
    >
      {label ? (
        <p className="mb-1 font-medium text-zinc-200">{label}</p>
      ) : null}
      <p className="tabular-nums text-emerald-300">
        {count} déblocage{count > 1 ? "s" : ""}
      </p>
    </div>
  );
}
