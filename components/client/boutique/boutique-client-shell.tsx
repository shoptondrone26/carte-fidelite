"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { ShopCartDrawer } from "@/components/client/boutique/shop-cart-drawer";
import { ShopCartProvider } from "@/components/client/boutique/shop-cart-provider";
import { ShopCartUiContext } from "@/lib/boutique/cart";

type BoutiqueClientShellProps = {
  children: ReactNode;
  onOrdersChanged?: () => void;
};

export function BoutiqueClientShell({
  children,
  onOrdersChanged,
}: BoutiqueClientShellProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const openCart = useCallback(() => setCartOpen(true), []);
  const uiValue = useMemo(() => ({ openCart }), [openCart]);

  return (
    <ShopCartProvider>
      <ShopCartUiContext.Provider value={uiValue}>
        {children}
        <ShopCartDrawer
          open={cartOpen}
          onOpenChange={setCartOpen}
          onOrdersChanged={onOrdersChanged}
        />
      </ShopCartUiContext.Provider>
    </ShopCartProvider>
  );
}
