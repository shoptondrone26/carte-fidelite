import { StatCard } from "@/components/admin/admin-ui";
import { MoneyStatCard } from "@/components/admin/accounting/money-stat-card";
import { PeriodRevenueCard } from "@/components/admin/accounting/period-revenue-card";
import { formatEur, type AccountingSummary } from "@/lib/admin/accounting";

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

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
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
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MoneyStatCard
          label="CA Boutique"
          value={formatEur(summary.revenueShop)}
          accent="amber"
        />
        <StatCard
          label="Commandes boutique terminées"
          value={summary.shopOrdersCompletedCount}
          accent="emerald"
        />
        <div className="rounded-2xl border border-white/10 bg-card/50 p-4 shadow-inner shadow-black/20">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Panier moyen boutique
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-100">
            {summary.shopOrdersCompletedCount > 0 && summary.avgShopBasket > 0
              ? formatEur(summary.avgShopBasket)
              : formatEur(0)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-card/50 p-4 shadow-inner shadow-black/20">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Panier moyen déblocages
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {summary.avgBasket > 0 ? formatEur(summary.avgBasket) : "—"}
          </p>
        </div>
      </section>
    </div>
  );
}
