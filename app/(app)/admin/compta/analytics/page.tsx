import type { Metadata } from "next";

import { AdvancedAnalyticsDashboard } from "@/components/admin/accounting/advanced-analytics-dashboard";
import { fetchAdvancedAccountingAnalytics } from "@/lib/admin/advanced-accounting-analytics";
import { requireAdmin } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics comptabilité",
};

export default async function AdminComptaAnalyticsPage() {
  const { supabase } = await requireAdmin("/admin/compta/analytics");
  const data = await fetchAdvancedAccountingAnalytics(supabase, {
    preset: "30d",
  });

  return <AdvancedAnalyticsDashboard initial={data} />;
}
