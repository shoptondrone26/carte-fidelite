"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  readShopCartStorage,
  ShopCartContext,
  writeShopCartStorage,
  type ShopCartItem,
} from "@/lib/boutique/cart";
import { productPrimaryImage } from "@/lib/boutique/images";
import type { ShopProduct } from "@/lib/boutique/types";

export function ShopCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ShopCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readShopCartStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeShopCartStorage(items);
  }, [items, hydrated]);

  const addProduct = useCallback((product: ShopProduct) => {
    if (product.stock <= 0) return false;
    let added = false;
    setItems((prev) => {
      if (prev.some((i) => i.productId === product.id)) return prev;
      added = true;
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          priceEur: product.price_eur,
          imageUrl: productPrimaryImage(product),
          addedAt: new Date().toISOString(),
        },
      ];
    });
    return added;
  }, []);

  const removeProduct = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const hasProduct = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      addProduct,
      removeProduct,
      hasProduct,
    }),
    [items, addProduct, removeProduct, hasProduct],
  );

  return (
    <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>
  );
}
