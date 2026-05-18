"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  AdminBookingRow,
  AdminClientRow,
  AdminStats,
} from "@/components/admin/admin-types";
import { AdminHomeView } from "@/components/admin/views/admin-home-view";
import { useAdminRealtimeRefetch } from "@/hooks/use-admin-realtime-refetch";
import {
  fetchAdminBookings,
  fetchAdminStats,
  fetchAdminTopClients,
} from "@/lib/admin/data";
import {
  fetchAdminPhantomRequests,
  type AdminPhantomRequest,
} from "@/lib/phantom/requests";
import { ADMIN_HOME_SYNC } from "@/lib/realtime/admin-sync";
import { createClient } from "@/lib/supabase/client";

type AdminHomeLiveProps = {
  initial: {
    stats: AdminStats;
    topClients: AdminClientRow[];
    pending: AdminBookingRow[];
    phantomRequests: AdminPhantomRequest[];
  };
};

export function AdminHomeLive({ initial }: AdminHomeLiveProps) {
  const [data, setData] = useState(initial);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const { pending } = await fetchAdminBookings(supabase);
    const [stats, topClients, phantomRequests] = await Promise.all([
      fetchAdminStats(
        supabase,
        pending.filter((b) => b.status === "pending").length,
      ),
      fetchAdminTopClients(supabase),
      fetchAdminPhantomRequests(supabase),
    ]);
    setData({ stats, topClients, pending, phantomRequests });
  }, []);

  useAdminRealtimeRefetch(refetch, ADMIN_HOME_SYNC, 400, "admin:home");

  return (
    <AdminHomeView
      stats={data.stats}
      topClients={data.topClients}
      pending={data.pending}
      phantomRequests={data.phantomRequests}
    />
  );
}
