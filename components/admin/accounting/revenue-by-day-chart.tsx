"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "@/components/admin/accounting/chart-card";
import { ChartEmpty } from "@/components/admin/accounting/chart-empty";
import { ChartTooltip } from "@/components/admin/accounting/chart-tooltip";
import { CHART_COLORS, chartMargin } from "@/components/admin/accounting/chart-theme";
import type { DailyMetricPoint } from "@/lib/admin/accounting";

type RevenueByDayChartProps = {
  data: DailyMetricPoint[];
};

export function RevenueByDayChart({ data }: RevenueByDayChartProps) {
  const hasData = data.some((d) => d.revenue > 0);

  return (
    <ChartCard
      title="Chiffre d'affaires par jour"
      description="7 derniers jours"
    >
      {hasData ? (
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={chartMargin}>
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
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: CHART_COLORS.amberDim }}
              />
              <Bar
                dataKey="revenue"
                name="CA"
                fill={CHART_COLORS.amber}
                radius={[6, 6, 0, 0]}
                animationDuration={700}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty />
      )}
    </ChartCard>
  );
}
