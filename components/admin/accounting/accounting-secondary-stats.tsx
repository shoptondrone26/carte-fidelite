import { StatCard } from "@/components/admin/admin-ui";
import { formatEur, type AccountingSummary } from "@/lib/admin/accounting";

type AccountingSecondaryStatsProps = {
  summary: AccountingSummary;
};

export function AccountingSecondaryStats({
  summary,
}: AccountingSecondaryStatsProps) {
  return (
    <section className="grid grid-cols-2 gap-3">
      <StatCard
        label="Déblocages validés"
        value={summary.paidUnlocksCount}
        accent="amber"
      />
      <StatCard
        label="Aujourd'hui"
        value={summary.paidUnlocksToday}
        accent="emerald"
      />
      <StatCard
        label="Gratuits utilisés"
        value={summary.freeUsedCount}
        accent="violet"
      />
      <StatCard
        label="Mode Phantom"
        value={summary.phantomCompletedCount}
        accent="amber"
      />
      <div className="rounded-2xl border border-amber-200/15 bg-amber-500/10 p-4 shadow-inner shadow-black/20">
        <p className="text-[11px] font-medium uppercase tracking-wide text-amber-100/80">
          CA Phantom
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-50">
          {formatEur(summary.phantomRevenueTotal)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatEur(summary.phantomRevenueMonth)} ce mois
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-card/50 p-4 shadow-inner shadow-black/20">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Panier moyen
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {summary.avgBasket > 0 ? formatEur(summary.avgBasket) : "—"}
        </p>
      </div>
    </section>
  );
}
