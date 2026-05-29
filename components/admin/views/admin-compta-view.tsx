import Link from "next/link";
import { BarChart3 } from "lucide-react";

import { AccountingAnalyticsSection } from "@/components/admin/accounting/accounting-analytics";
import { AccountingKpiGrid } from "@/components/admin/accounting/accounting-kpi-grid";
import { AccountingLedger } from "@/components/admin/accounting/accounting-ledger";
import { AccountingSecondaryStats } from "@/components/admin/accounting/accounting-secondary-stats";
import { AccountingTopClients } from "@/components/admin/accounting/accounting-top-clients";
import type {
  AccountingAnalytics,
  AccountingLedgerEntry,
  AccountingSummary,
  TopClientByRevenue,
} from "@/lib/admin/accounting";

type AdminComptaViewProps = {
  summary: AccountingSummary;
  analytics: AccountingAnalytics;
  topClients: TopClientByRevenue[];
  ledger: AccountingLedgerEntry[];
};

export function AdminComptaView({
  summary,
  analytics,
  topClients,
  ledger,
}: AdminComptaViewProps) {
  return (
    <div className="flex flex-col gap-8 pb-4">
      <p className="text-sm text-muted-foreground">
        Suivi du CA total : déblocages, Mode Fantôme et boutique (ventes
        comptabilisées à la clôture « terminée »). Données visibles uniquement
        par les administrateurs.
      </p>

      <AccountingKpiGrid summary={summary} />
      <AccountingSecondaryStats summary={summary} />
      <AccountingAnalyticsSection analytics={analytics} />
      <AccountingTopClients clients={topClients} />
      <AccountingLedger entries={ledger} />

      <Link
        href="/admin/compta/analytics"
        className="group flex items-center gap-4 rounded-2xl border border-amber-400/25 bg-linear-to-br from-amber-500/10 via-card/40 to-black/20 p-5 shadow-inner shadow-amber-950/20 transition hover:border-amber-400/40 hover:from-amber-500/15"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 ring-1 ring-amber-400/30">
          <BarChart3 className="size-5 text-amber-200" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-50">
            Voir les analytics avancés
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Dashboard Shopify — CA, boutique, réservations, déblocages, filtres
            temporels.
          </p>
        </div>
        <span className="shrink-0 text-xs font-semibold text-amber-300 transition group-hover:translate-x-0.5">
          Ouvrir →
        </span>
      </Link>
    </div>
  );
}
