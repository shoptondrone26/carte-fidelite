"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "@/components/admin/accounting/chart-card";
import { ChartEmpty } from "@/components/admin/accounting/chart-empty";
import { CountTooltip } from "@/components/admin/accounting/chart-tooltip";
import { CHART_COLORS, chartMargin } from "@/components/admin/accounting/chart-theme";
import type { DailyMetricPoint } from "@/lib/admin/accounting";

type UnlocksByDayChartProps = {
  data: DailyMetricPoint[];
};

export function UnlocksByDayChart({ data }: UnlocksByDayChartProps) {
  const hasData = data.some((d) => d.unlocks > 0);

  return (
    <ChartCard
      title="Déblocages validés"
      description="Nombre par jour — 7 derniers jours"
    >
      {hasData ? (
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={chartMargin}>
              <defs>
                <linearGradient id="unlocksFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.emerald} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={CHART_COLORS.emerald} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_COLORS.grid}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip content={<CountTooltip />} />
              <Area
                type="monotone"
                dataKey="unlocks"
                name="Déblocages"
                stroke={CHART_COLORS.emerald}
                strokeWidth={2}
                fill="url(#unlocksFill)"
                animationDuration={700}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty message="Aucun déblocage payant sur les 7 derniers jours." />
      )}
    </ChartCard>
  );
}
