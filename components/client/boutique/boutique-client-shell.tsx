"use client";

import type { ReactNode } from "react";

import { ShopCartProvider } from "@/components/client/boutique/shop-cart-provider";

type BoutiqueClientShellProps = {
  children: ReactNode;
};

export function BoutiqueClientShell({ children }: BoutiqueClientShellProps) {
  return <ShopCartProvider>{children}</ShopCartProvider>;
}
