import { MoneyStatCard } from "@/components/admin/accounting/money-stat-card";
import { formatEur, type AccountingSummary } from "@/lib/admin/accounting";

type AccountingKpiGridProps = {
  summary: AccountingSummary;
};

export function AccountingKpiGrid({ summary }: AccountingKpiGridProps) {
  return (
    <section className="grid grid-cols-2 gap-3">
      <MoneyStatCard
        label="Chiffre total"
        value={formatEur(summary.revenueTotal)}
        accent="amber"
      />
      <MoneyStatCard
        label="Aujourd'hui"
        value={formatEur(summary.revenueToday)}
        accent="emerald"
      />
      <MoneyStatCard
        label="Cette semaine"
        value={formatEur(summary.revenueWeek)}
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
