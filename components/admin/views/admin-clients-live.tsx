"use client";

import { useCallback, useEffect, useState } from "react";

import type { AdminClientCardData } from "@/components/admin/admin-client-card";
import type { AdminHistorySnippet } from "@/components/admin/admin-client-card";
import { AdminClientsView } from "@/components/admin/views/admin-clients-view";
import { useAdminRealtimeRefetch } from "@/hooks/use-admin-realtime-refetch";
import { fetchAdminClients } from "@/lib/admin/data";
import { ADMIN_CLIENTS_SYNC } from "@/lib/realtime/admin-sync";
import { createClient } from "@/lib/supabase/client";

type AdminClientsLiveProps = {
  initial: {
    addressBook: AdminClientCardData[];
    historyByClient: Record<string, AdminHistorySnippet[]>;
  };
};

export function AdminClientsLive({ initial }: AdminClientsLiveProps) {
  const [data, setData] = useState(initial);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const next = await fetchAdminClients(supabase);
    setData(next);
  }, []);

  useAdminRealtimeRefetch(refetch, ADMIN_CLIENTS_SYNC, 400, "admin:clients");

  return (
    <AdminClientsView
      addressBook={data.addressBook}
      historyByClient={data.historyByClient}
    />
  );
}
