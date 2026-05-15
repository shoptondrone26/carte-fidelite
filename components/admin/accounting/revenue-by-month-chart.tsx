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
import type { MonthlyMetricPoint } from "@/lib/admin/accounting";

type RevenueByMonthChartProps = {
  data: MonthlyMetricPoint[];
};

export function RevenueByMonthChart({ data }: RevenueByMonthChartProps) {
  const hasData = data.some((d) => d.revenue > 0);

  return (
    <ChartCard
      title="Chiffre d'affaires par mois"
      description="6 derniers mois"
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
                tick={{ fill: CHART_COLORS.axis, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={48}
              />
              <YAxis
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: CHART_COLORS.violetDim }}
              />
              <Bar
                dataKey="revenue"
                name="CA"
                fill={CHART_COLORS.violet}
                radius={[6, 6, 0, 0]}
                animationDuration={800}
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
