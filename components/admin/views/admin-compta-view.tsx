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
        Suivi du CA total : déblocages payants et Mode Fantôme. Données
        visibles uniquement par les administrateurs.
      </p>

      <AccountingKpiGrid summary={summary} />
      <AccountingSecondaryStats summary={summary} />
      <AccountingAnalyticsSection analytics={analytics} />
      <AccountingTopClients clients={topClients} />
      <AccountingLedger entries={ledger} />
    </div>
  );
}
