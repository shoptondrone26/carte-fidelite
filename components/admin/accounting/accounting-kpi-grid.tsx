import { MoneyStatCard } from "@/components/admin/accounting/money-stat-card";
import { formatEur, type AccountingSummary } from "@/lib/admin/accounting";

type AccountingKpiGridProps = {
  summary: AccountingSummary;
};

export function AccountingKpiGrid({ summary }: AccountingKpiGridProps) {
  return (
    <section className="grid grid-cols-2 gap-3">
      <MoneyStatCard
        label="CA total"
        value={formatEur(summary.revenueTotal)}
        accent="amber"
      />
      <MoneyStatCard
        label="CA déblocages"
        value={formatEur(summary.revenueUnlocks)}
        accent="emerald"
      />
      <MoneyStatCard
        label="CA Mode Fantôme"
        value={formatEur(summary.revenuePhantom)}
        accent="violet"
      />
      <MoneyStatCard
        label="Ce mois"
        value={formatEur(summary.revenueMonth)}
        accent="zinc"
      />
    </section>
  );
}
