"use client";

import { useCallback, useEffect, useState } from "react";

import { AdminGiftsView } from "@/components/admin/views/admin-gifts-view";
import { useAdminRealtimeRefetch } from "@/hooks/use-admin-realtime-refetch";
import { fetchAdminGifts, type AdminGiftsSnapshot } from "@/lib/admin/gifts";
import { ADMIN_GIFTS_SYNC } from "@/lib/realtime/admin-sync";
import { createClient } from "@/lib/supabase/client";

type AdminGiftsLiveProps = {
  initial: AdminGiftsSnapshot;
};

export function AdminGiftsLive({ initial }: AdminGiftsLiveProps) {
  const [data, setData] = useState(initial);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    setData(await fetchAdminGifts(supabase));
  }, []);

  useAdminRealtimeRefetch(refetch, ADMIN_GIFTS_SYNC, 500, "admin:gifts");

  return <AdminGiftsView data={data} />;
}

