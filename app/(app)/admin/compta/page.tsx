import type { Metadata } from "next";

import { AdminComptaLive } from "@/components/admin/views/admin-compta-live";
import {
  fetchAccountingAnalytics,
  fetchAccountingLedger,
  fetchAccountingSummary,
  fetchTopClientsByRevenue,
} from "@/lib/admin/accounting";
import { requireAdmin } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Comptabilité",
};

export default async function AdminComptaPage() {
  const { supabase } = await requireAdmin("/admin/compta");

  const [summary, analytics, topClients, ledger] = await Promise.all([
    fetchAccountingSummary(supabase),
    fetchAccountingAnalytics(supabase),
    fetchTopClientsByRevenue(supabase, 10),
    fetchAccountingLedger(supabase, 50),
  ]);

  return (
    <AdminComptaLive
      initial={{ summary, analytics, topClients, ledger }}
    />
  );
}
