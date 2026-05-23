"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchClientTrackableShopOrdersAction } from "@/actions/shop-orders";
import {
  shopOrdersChannelName,
  type ShopOrder,
} from "@/lib/boutique/orders";
import { createClient } from "@/lib/supabase/client";

export function useClientParcelTrackingRealtime(
  initialOrders: ShopOrder[],
  userId: string,
) {
  const [orders, setOrders] = useState(initialOrders);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const refetch = useCallback(async () => {
    const next = await fetchClientTrackableShopOrdersAction();
    setOrders(next);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void refetch();
      }, 300);
    };

    const channel = supabase
      .channel(`${shopOrdersChannelName(userId)}:tracking`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shop_orders",
          filter: `profile_id=eq.${userId}`,
        },
        schedule,
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") schedule();
      });

    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [refetch, userId]);

  return { orders, refetch };
}
