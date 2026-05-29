"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "@/components/admin/accounting/chart-card";
import { ChartEmpty } from "@/components/admin/accounting/chart-empty";
import { ChartTooltip } from "@/components/admin/accounting/chart-tooltip";
import { CHART_COLORS, chartMargin } from "@/components/admin/accounting/chart-theme";
import type { AdvancedAnalyticsPoint } from "@/lib/admin/advanced-accounting-analytics";

type SeriesChartProps = {
  data: AdvancedAnalyticsPoint[];
  title: string;
  description?: string;
  dataKey: keyof AdvancedAnalyticsPoint;
  name: string;
  color?: string;
  type?: "area" | "bar" | "line";
  formatValue?: (n: number) => string;
  valueSuffix?: string;
};

function hasSeriesData(
  data: AdvancedAnalyticsPoint[],
  key: keyof AdvancedAnalyticsPoint,
): boolean {
  return data.some((d) => Number(d[key]) > 0);
}

function CountChartTooltip({
  active,
  label,
  payload,
  unit,
}: {
  active?: boolean;
  label?: string;
  payload?: { value?: number; name?: string }[];
  unit: string;
}) {
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
      {label ? <p className="mb-1 font-medium text-zinc-200">{label}</p> : null}
      <p className="tabular-nums text-emerald-300">
        {count} {unit}
        {count > 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function AdvancedSeriesChart({
  data,
  title,
  description,
  dataKey,
  name,
  color = CHART_COLORS.amber,
  type = "area",
  formatValue,
  valueSuffix = "€",
}: SeriesChartProps) {
  const hasData = hasSeriesData(data, dataKey);

  return (
    <ChartCard title={title} description={description}>
      {hasData ? (
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {type === "bar" ? (
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
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  content={
                    valueSuffix === "€" ? (
                      <ChartTooltip formatValue={formatValue} />
                    ) : (
                      <CountChartTooltip unit={valueSuffix} />
                    )
                  }
                  cursor={{ fill: CHART_COLORS.amberDim }}
                />
                <Bar
                  dataKey={dataKey}
                  name={name}
                  fill={color}
                  radius={[6, 6, 0, 0]}
                  animationDuration={700}
                />
              </BarChart>
            ) : type === "line" ? (
              <LineChart data={data} margin={chartMargin}>
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
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  content={
                    valueSuffix === "€" ? (
                      <ChartTooltip formatValue={formatValue} />
                    ) : (
                      <CountChartTooltip unit={valueSuffix} />
                    )
                  }
                />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  name={name}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  animationDuration={700}
                />
              </LineChart>
            ) : (
              <AreaChart data={data} margin={chartMargin}>
                <defs>
                  <linearGradient id={`grad-${String(dataKey)}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  content={
                    valueSuffix === "€" ? (
                      <ChartTooltip formatValue={formatValue} />
                    ) : (
                      <CountChartTooltip unit={valueSuffix} />
                    )
                  }
                />
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  name={name}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#grad-${String(dataKey)})`}
                  animationDuration={700}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <ChartEmpty />
      )}
    </ChartCard>
  );
}
