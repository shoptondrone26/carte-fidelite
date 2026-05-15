"use client";

import { useCallback, useEffect, useState } from "react";

import { AdminComptaView } from "@/components/admin/views/admin-compta-view";
import { useAdminRealtimeRefetch } from "@/hooks/use-admin-realtime-refetch";
import {
  fetchAccountingAnalytics,
  fetchAccountingLedger,
  fetchAccountingSummary,
  fetchTopClientsByRevenue,
  type AccountingAnalytics,
  type AccountingLedgerEntry,
  type AccountingSummary,
  type TopClientByRevenue,
} from "@/lib/admin/accounting";
import { ADMIN_COMPTA_SYNC } from "@/lib/realtime/admin-sync";
import { createClient } from "@/lib/supabase/client";

type AdminComptaLiveProps = {
  initial: {
    summary: AccountingSummary;
    analytics: AccountingAnalytics;
    topClients: TopClientByRevenue[];
    ledger: AccountingLedgerEntry[];
  };
};

export function AdminComptaLive({ initial }: AdminComptaLiveProps) {
  const [data, setData] = useState(initial);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const [summary, analytics, topClients, ledger] = await Promise.all([
      fetchAccountingSummary(supabase),
      fetchAccountingAnalytics(supabase),
      fetchTopClientsByRevenue(supabase, 10),
      fetchAccountingLedger(supabase, 50),
    ]);
    setData({ summary, analytics, topClients, ledger });
  }, []);

  useAdminRealtimeRefetch(refetch, ADMIN_COMPTA_SYNC, 400, "admin:compta");

  return (
    <AdminComptaView
      summary={data.summary}
      analytics={data.analytics}
      topClients={data.topClients}
      ledger={data.ledger}
    />
  );
}
