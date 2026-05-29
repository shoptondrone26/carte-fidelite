"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { ArrowLeft, BarChart3, CalendarRange } from "lucide-react";
import { toast } from "sonner";

import { fetchAdvancedAccountingAnalyticsAction } from "@/actions/accounting-analytics";
import { AdvancedSeriesChart } from "@/components/admin/accounting/advanced-series-chart";
import { CHART_COLORS } from "@/components/admin/accounting/chart-theme";
import { MoneyStatCard } from "@/components/admin/accounting/money-stat-card";
import { StatCard } from "@/components/admin/admin-ui";
import { useAdminRealtimeRefetch } from "@/hooks/use-admin-realtime-refetch";
import {
  type AdvancedAccountingAnalytics,
  type AnalyticsPeriodPreset,
} from "@/lib/admin/advanced-accounting-analytics";
import { formatEur } from "@/lib/admin/accounting";
import { ADMIN_COMPTA_SYNC } from "@/lib/realtime/admin-sync";
import { cn } from "@/lib/utils";

type AdvancedAnalyticsDashboardProps = {
  initial: AdvancedAccountingAnalytics;
};

const PERIOD_OPTIONS: { id: AnalyticsPeriodPreset; label: string }[] = [
  { id: "today", label: "Aujourd'hui" },
  { id: "7d", label: "7 jours" },
  { id: "30d", label: "30 jours" },
  { id: "3m", label: "3 mois" },
  { id: "1y", label: "1 an" },
  { id: "all", label: "Tout" },
];

export function AdvancedAnalyticsDashboard({
  initial,
}: AdvancedAnalyticsDashboardProps) {
  const [data, setData] = useState(initial);
  const [preset, setPreset] = useState<AnalyticsPeriodPreset>(initial.preset);
  const [customStart, setCustomStart] = useState(initial.customStart ?? "");
  const [customEnd, setCustomEnd] = useState(initial.customEnd ?? "");
  const [showCustom, setShowCustom] = useState(false);
  const [pending, startTransition] = useTransition();

  const load = useCallback(
    (
      nextPreset: AnalyticsPeriodPreset,
      start?: string,
      end?: string,
    ) => {
      startTransition(async () => {
        const res = await fetchAdvancedAccountingAnalyticsAction(
          nextPreset,
          start || undefined,
          end || undefined,
        );
        if (res.ok) {
          setData(res.data);
        } else {
          toast.error(res.error);
        }
      });
    },
    [],
  );

  const refetch = useCallback(() => {
    load(
      preset,
      showCustom && customStart ? customStart : undefined,
      showCustom && customEnd ? customEnd : undefined,
    );
  }, [load, preset, showCustom, customStart, customEnd]);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  useAdminRealtimeRefetch(refetch, ADMIN_COMPTA_SYNC, 600, "admin:compta-analytics");

  function onPresetChange(next: AnalyticsPeriodPreset) {
    setPreset(next);
    setShowCustom(false);
    load(next);
  }

  function onApplyCustom() {
    if (!customStart) {
      toast.error("Indiquez une date de début.");
      return;
    }
    setShowCustom(true);
    load(preset, customStart, customEnd || undefined);
  }

  const { kpis, series } = data;

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/compta"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-amber-200"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Retour comptabilité
          </Link>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-amber-300" aria-hidden />
            <h1 className="text-lg font-semibold tracking-tight">
              Analytics avancés
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Vue Shopify — CA, boutique, réservations, déblocages et Mode Fantôme.
          </p>
        </div>
      </div>

      {/* Period filters */}
      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={pending}
              onClick={() => onPresetChange(option.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                preset === option.id && !showCustom
                  ? "bg-amber-400 text-zinc-950"
                  : "border border-white/10 bg-card/40 text-zinc-300 hover:bg-white/5",
                pending && "opacity-50",
              )}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            disabled={pending}
            onClick={() => setShowCustom((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
              showCustom
                ? "bg-amber-400 text-zinc-950"
                : "border border-white/10 bg-card/40 text-zinc-300 hover:bg-white/5",
            )}
          >
            <CalendarRange className="size-3.5" aria-hidden />
            Personnalisé
          </button>
        </div>

        {showCustom ? (
          <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-white/10 bg-card/30 p-3">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Début
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Fin
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              />
            </label>
            <button
              type="button"
              disabled={pending}
              onClick={onApplyCustom}
              className="min-h-10 rounded-full bg-amber-400 px-4 text-xs font-bold text-zinc-950 disabled:opacity-50"
            >
              Appliquer
            </button>
          </div>
        ) : null}
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MoneyStatCard
          label="CA total"
          value={formatEur(kpis.total)}
          accent="amber"
        />
        <MoneyStatCard
          label="CA boutique"
          value={formatEur(kpis.shop)}
          accent="emerald"
        />
        <StatCard
          label="Réservations"
          value={kpis.bookingsCount}
          accent="violet"
        />
        <StatCard
          label="Déblocages"
          value={kpis.unlocksCount}
          accent="emerald"
        />
        <MoneyStatCard
          label="Panier moyen"
          value={kpis.avgBasket > 0 ? formatEur(kpis.avgBasket) : "—"}
          accent="zinc"
        />
        <MoneyStatCard
          label="Revenus Mode Fantôme"
          value={formatEur(kpis.phantom)}
          accent="violet"
        />
      </section>

      {/* Charts */}
      <section className="flex flex-col gap-4">
        <AdvancedSeriesChart
          data={series}
          title="Chiffre d'affaires"
          description="Évolution du CA total sur la période"
          dataKey="revenue"
          name="CA"
          color={CHART_COLORS.amber}
          type="area"
        />

        <AdvancedSeriesChart
          data={series}
          title="Réservations"
          description="Nombre de demandes créées"
          dataKey="bookings"
          name="Réservations"
          color={CHART_COLORS.violet}
          type="bar"
          valueSuffix="réservation"
        />

        <AdvancedSeriesChart
          data={series}
          title="CA boutique"
          description="Revenus boutique comptabilisés"
          dataKey="shop"
          name="Boutique"
          color={CHART_COLORS.emerald}
          type="area"
        />

        <AdvancedSeriesChart
          data={series}
          title="Déblocages"
          description="Nombre de déblocages payants"
          dataKey="unlockCount"
          name="Déblocages"
          color={CHART_COLORS.emerald}
          type="bar"
          valueSuffix="déblocage"
        />

        <AdvancedSeriesChart
          data={series}
          title="Mode Fantôme"
          description="Revenus et demandes comptabilisées"
          dataKey="phantom"
          name="Mode Fantôme"
          color={CHART_COLORS.violet}
          type="line"
        />
      </section>
    </div>
  );
}
