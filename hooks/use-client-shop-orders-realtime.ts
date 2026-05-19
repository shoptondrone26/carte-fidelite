"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchClientActiveShopOrdersAction } from "@/actions/shop-orders";
import {
  shopOrdersChannelName,
  type ShopOrder,
} from "@/lib/boutique/orders";
import { createClient } from "@/lib/supabase/client";

export function useClientShopOrdersRealtime(
  initialOrders: ShopOrder[],
  userId: string,
) {
  const [orders, setOrders] = useState(initialOrders);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const refetch = useCallback(async () => {
    const next = await fetchClientActiveShopOrdersAction();
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
      .channel(shopOrdersChannelName(userId))
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shop_products" },
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
