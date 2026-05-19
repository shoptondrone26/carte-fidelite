"use client";

import { createContext, useContext } from "react";

import type { ShopProduct } from "@/lib/boutique/types";

export const SHOP_CART_STORAGE_KEY = "shoptondrone-cart-v1";

export type ShopCartItem = {
  productId: string;
  name: string;
  priceEur: number;
  imageUrl: string | null;
  addedAt: string;
};

export type ShopCartContextValue = {
  items: ShopCartItem[];
  count: number;
  addProduct: (product: ShopProduct) => boolean;
  removeProduct: (productId: string) => void;
  hasProduct: (productId: string) => boolean;
};

export const ShopCartContext = createContext<ShopCartContextValue | null>(null);

export function useShopCart() {
  const ctx = useContext(ShopCartContext);
  if (!ctx) {
    throw new Error("useShopCart must be used within ShopCartProvider");
  }
  return ctx;
}

export function readShopCartStorage(): ShopCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SHOP_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ShopCartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeShopCartStorage(items: ShopCartItem[]) {
  window.localStorage.setItem(SHOP_CART_STORAGE_KEY, JSON.stringify(items));
}
