"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  cartItemCount,
  cartTotalEur,
  readShopCartStorage,
  ShopCartContext,
  writeShopCartStorage,
  type ShopCartItem,
} from "@/lib/boutique/cart";
import { productPrimaryImage } from "@/lib/boutique/images";
import type { ShopProduct } from "@/lib/boutique/types";

function toCartLine(product: ShopProduct, quantity: number): ShopCartItem {
  return {
    productId: product.id,
    name: product.name,
    priceEur: product.price_eur,
    imageUrl: productPrimaryImage(product),
    quantity,
    stockMax: product.stock,
    addedAt: new Date().toISOString(),
  };
}

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

  const addProduct = useCallback((product: ShopProduct, quantity = 1) => {
    if (product.stock <= 0 || quantity < 1) return false;
    let added = false;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const nextQty = Math.min(
          existing.quantity + quantity,
          product.stock,
        );
        if (nextQty === existing.quantity) return prev;
        added = true;
        return prev.map((i) =>
          i.productId === product.id
            ? {
                ...i,
                quantity: nextQty,
                stockMax: product.stock,
                priceEur: product.price_eur,
                name: product.name,
                imageUrl: productPrimaryImage(product),
              }
            : i,
        );
      }
      const qty = Math.min(quantity, product.stock);
      added = true;
      return [...prev, toCartLine(product, qty)];
    });
    return added;
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity < 1) {
        return prev.filter((i) => i.productId !== productId);
      }
      return prev.map((i) => {
        if (i.productId !== productId) return i;
        const max = Math.max(i.stockMax, 1);
        return { ...i, quantity: Math.min(quantity, max) };
      });
    });
  }, []);

  const removeProduct = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const hasProduct = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items],
  );

  const getQuantity = useCallback(
    (productId: string) =>
      items.find((i) => i.productId === productId)?.quantity ?? 0,
    [items],
  );

  const syncStockFromCatalog = useCallback((products: ShopProduct[]) => {
    const byId = new Map(products.map((p) => [p.id, p]));
    setItems((prev) => {
      const next = prev
        .map((item) => {
          const p = byId.get(item.productId);
          if (!p || p.stock <= 0) return null;
          const qty = Math.min(item.quantity, p.stock);
          return {
            ...item,
            quantity: qty,
            stockMax: p.stock,
            priceEur: p.price_eur,
            name: p.name,
            imageUrl: productPrimaryImage(p),
          };
        })
        .filter((i): i is ShopCartItem => i !== null);
      return next;
    });
  }, []);

  const itemCount = useMemo(() => cartItemCount(items), [items]);
  const totalEur = useMemo(() => cartTotalEur(items), [items]);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      lineCount: items.length,
      totalEur,
      addProduct,
      setQuantity,
      removeProduct,
      clearCart,
      hasProduct,
      getQuantity,
      syncStockFromCatalog,
    }),
    [
      items,
      itemCount,
      totalEur,
      addProduct,
      setQuantity,
      removeProduct,
      clearCart,
      hasProduct,
      getQuantity,
      syncStockFromCatalog,
    ],
  );

  return (
    <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>
  );
}
