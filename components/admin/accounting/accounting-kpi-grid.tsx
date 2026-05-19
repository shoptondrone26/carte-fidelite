import { MoneyStatCard } from "@/components/admin/accounting/money-stat-card";
import { PeriodRevenueCard } from "@/components/admin/accounting/period-revenue-card";
import { formatEur, type AccountingSummary } from "@/lib/admin/accounting";
import { cn } from "@/lib/utils";

type AccountingKpiGridProps = {
  summary: AccountingSummary;
};

export function AccountingKpiGrid({ summary }: AccountingKpiGridProps) {
  return (
    <div className="flex flex-col gap-3">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PeriodRevenueCard
          title="AUJOURD'HUI"
          period={summary.today}
          accent="emerald"
          compareLabel="vs hier"
        />
        <PeriodRevenueCard
          title="CETTE SEMAINE"
          period={summary.week}
          accent="violet"
          compareLabel="vs 7 jours précédents"
        />
        <PeriodRevenueCard
          title="CE MOIS"
          period={summary.month}
          accent="zinc"
          compareLabel="vs mois précédent"
        />
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
        <div className={cn("col-span-2 sm:col-span-1")}>
          <MoneyStatCard
            label="CA Mode Fantôme"
            value={formatEur(summary.revenuePhantom)}
            accent="violet"
          />
        </div>
      </section>
    </div>
  );
}
