import { StatCard } from "@/components/admin/admin-ui";
import type { AccountingSummary } from "@/lib/admin/accounting";

type AccountingSecondaryStatsProps = {
  summary: AccountingSummary;
};

export function AccountingSecondaryStats({
  summary,
}: AccountingSecondaryStatsProps) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <StatCard
        label="Déblocages validés"
        value={summary.paidUnlocksCount}
        accent="amber"
      />
      <StatCard
        label="Mode Fantôme réalisés"
        value={summary.phantomModeCount}
        accent="emerald"
      />
      <StatCard
        label="Gratuits utilisés"
        value={summary.freeUsedCount}
        accent="violet"
      />
    </section>
  );
}
