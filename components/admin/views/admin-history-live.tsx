"use client";

import { useCallback, useEffect, useState } from "react";

import { AdminHistoryView } from "@/components/admin/views/admin-history-view";
import { useAdminRealtimeRefetch } from "@/hooks/use-admin-realtime-refetch";
import { fetchAdminGlobalHistory, type AdminHistoryEntry } from "@/lib/admin/data";
import { ADMIN_HISTORY_SYNC } from "@/lib/realtime/admin-sync";
import { createClient } from "@/lib/supabase/client";

type AdminHistoryLiveProps = {
  initial: AdminHistoryEntry[];
};

export function AdminHistoryLive({ initial }: AdminHistoryLiveProps) {
  const [entries, setEntries] = useState(initial);

  useEffect(() => {
    setEntries(initial);
  }, [initial]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const next = await fetchAdminGlobalHistory(supabase);
    setEntries(next);
  }, []);

  useAdminRealtimeRefetch(refetch, ADMIN_HISTORY_SYNC, 400, "admin:history");

  return <AdminHistoryView entries={entries} />;
}
