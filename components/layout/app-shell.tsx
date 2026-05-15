import type { ReactNode } from "react";

import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <div className="flex flex-1 flex-col pb-[calc(5.25rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <MobileBottomNav />
    </div>
  );
}
