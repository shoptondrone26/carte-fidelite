"use client";

import { usePathname } from "next/navigation";

import { ClientNavBar } from "@/components/client/client-nav-bar";
import { ClientSignOutButton } from "@/components/client/client-sign-out-button";
import {
  getClientNavSubtitle,
  getClientNavTitle,
} from "@/lib/client/navigation";

export function ClientPrivateHeader() {
  const pathname = usePathname();
  const title = getClientNavTitle(pathname);
  const subtitle = getClientNavSubtitle(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/95 backdrop-blur-xl supports-backdrop-filter:bg-background/80">
      <div className="relative mx-auto w-full max-w-lg px-5 pb-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between gap-3 pb-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/90">
              ShopTonDrone Privé
            </p>
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {title}
            </h1>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {subtitle}
            </p>
          </div>
          <ClientSignOutButton />
        </div>
      </div>
      <ClientNavBar />
    </header>
  );
}

