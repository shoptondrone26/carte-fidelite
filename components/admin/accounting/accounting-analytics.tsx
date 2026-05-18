"use client";

import { RevenueByDayChart } from "@/components/admin/accounting/revenue-by-day-chart";
import { RevenueByMonthChart } from "@/components/admin/accounting/revenue-by-month-chart";
import { TopClientsBarChart } from "@/components/admin/accounting/top-clients-bar-chart";
import { UnlocksByDayChart } from "@/components/admin/accounting/unlocks-by-day-chart";
import type { AccountingAnalytics } from "@/lib/admin/accounting";

type AccountingAnalyticsSectionProps = {
  analytics: AccountingAnalytics;
};

export function AccountingAnalyticsSection({
  analytics,
}: AccountingAnalyticsSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Analytics</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Évolution du chiffre d&apos;affaires total et des déblocages payants.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <RevenueByDayChart data={analytics.dailyLast7} />
        <RevenueByMonthChart data={analytics.monthlyLast6} />
        <UnlocksByDayChart data={analytics.dailyLast7} />
        <TopClientsBarChart data={analytics.topClientsChart} />
      </div>
    </section>
  );
}
