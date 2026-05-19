"use client";

import { createContext, useContext } from "react";

import type { ShopProduct } from "@/lib/boutique/types";

export const SHOP_CART_STORAGE_KEY = "shoptondrone-cart-v2";

export type ShopCartItem = {
  productId: string;
  name: string;
  priceEur: number;
  imageUrl: string | null;
  quantity: number;
  /** Stock connu au dernier ajout / sync catalogue */
  stockMax: number;
  addedAt: string;
};

export type ShopCartContextValue = {
  items: ShopCartItem[];
  /** Nombre total d’unités */
  itemCount: number;
  /** Nombre de lignes */
  lineCount: number;
  totalEur: number;
  addProduct: (product: ShopProduct, quantity?: number) => boolean;
  setQuantity: (productId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  clearCart: () => void;
  hasProduct: (productId: string) => boolean;
  getQuantity: (productId: string) => number;
  syncStockFromCatalog: (products: ShopProduct[]) => void;
};

export const ShopCartContext = createContext<ShopCartContextValue | null>(null);

export const ShopCartUiContext = createContext<{
  openCart: () => void;
} | null>(null);

export function useShopCart() {
  const ctx = useContext(ShopCartContext);
  if (!ctx) {
    throw new Error("useShopCart must be used within ShopCartProvider");
  }
  return ctx;
}

export function useShopCartUi() {
  const ctx = useContext(ShopCartUiContext);
  if (!ctx) {
    throw new Error("useShopCartUi must be used within BoutiqueClientShell");
  }
  return ctx;
}

export function cartItemCount(items: ShopCartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function cartTotalEur(items: ShopCartItem[]): number {
  return items.reduce((sum, i) => sum + i.priceEur * i.quantity, 0);
}

export function readShopCartStorage(): ShopCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SHOP_CART_STORAGE_KEY);
    if (!raw) return migrateLegacyCart();
    const parsed = JSON.parse(raw) as ShopCartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i?.productId && i.quantity > 0)
      .map((i) => ({
        ...i,
        quantity: Math.max(1, Math.floor(i.quantity)),
        stockMax: Math.max(0, i.stockMax ?? 0),
      }));
  } catch {
    return [];
  }
}

function migrateLegacyCart(): ShopCartItem[] {
  try {
    const legacy = window.localStorage.getItem("shoptondrone-cart-v1");
    if (!legacy) return [];
    const parsed = JSON.parse(legacy) as Array<{
      productId: string;
      name: string;
      priceEur: number;
      imageUrl: string | null;
      addedAt: string;
    }>;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((i) => ({
      ...i,
      quantity: 1,
      stockMax: 99,
    }));
  } catch {
    return [];
  }
}

export function writeShopCartStorage(items: ShopCartItem[]) {
  window.localStorage.setItem(SHOP_CART_STORAGE_KEY, JSON.stringify(items));
}
