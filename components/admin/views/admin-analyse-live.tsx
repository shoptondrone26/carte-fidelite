"use client";

import { useCallback, useEffect, useState } from "react";

import { AdminAnalyseView } from "@/components/admin/views/admin-analyse-view";
import { useAdminRealtimeRefetch } from "@/hooks/use-admin-realtime-refetch";
import {
  fetchAdminAnalytics,
  type AdminAnalyticsSnapshot,
} from "@/lib/admin/analytics";
import { ADMIN_ANALYSE_SYNC } from "@/lib/realtime/admin-sync";
import { createClient } from "@/lib/supabase/client";

type AdminAnalyseLiveProps = {
  initial: AdminAnalyticsSnapshot;
};

export function AdminAnalyseLive({ initial }: AdminAnalyseLiveProps) {
  const [data, setData] = useState(initial);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    setData(await fetchAdminAnalytics(supabase));
  }, []);

  useAdminRealtimeRefetch(refetch, ADMIN_ANALYSE_SYNC, 500, "admin:analyse");

  return <AdminAnalyseView data={data} />;
}

