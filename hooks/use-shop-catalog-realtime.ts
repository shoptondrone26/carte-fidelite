"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchCatalogProducts,
  groupProductsByCategory,
} from "@/lib/boutique/products";
import type { ProductsByCategory, ShopProduct } from "@/lib/boutique/types";
import { createClient } from "@/lib/supabase/client";

export function useShopCatalogRealtime(initialProducts: ShopProduct[]) {
  const [products, setProducts] = useState(initialProducts);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const next = await fetchCatalogProducts(supabase);
    setProducts(next);
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
      .channel("shop:catalog")
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
  }, [refetch]);

  const categories = groupProductsByCategory(products);

  return { products, categories };
}

export type { ProductsByCategory };
