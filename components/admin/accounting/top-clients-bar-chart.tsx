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
import { CHART_COLORS } from "@/components/admin/accounting/chart-theme";
import type { TopClientChartPoint } from "@/lib/admin/accounting";

type TopClientsBarChartProps = {
  data: TopClientChartPoint[];
};

export function TopClientsBarChart({ data }: TopClientsBarChartProps) {
  const sorted = [...data].sort((a, b) => a.revenue - b.revenue);
  const height = Math.max(200, sorted.length * 36 + 24);

  return (
    <ChartCard
      title="Top clients"
      description="Chiffre d'affaires cumulé"
      className="col-span-1"
    >
      {sorted.length > 0 ? (
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sorted}
              layout="vertical"
              margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_COLORS.grid}
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={76}
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: CHART_COLORS.amberDim }}
              />
              <Bar
                dataKey="revenue"
                name="CA"
                fill={CHART_COLORS.amber}
                radius={[0, 6, 6, 0]}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty message="Aucun client avec du chiffre d'affaires." />
      )}
    </ChartCard>
  );
}
