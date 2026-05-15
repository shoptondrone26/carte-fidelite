import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { PushSessionBridge } from "@/components/notifications/push-session-bridge";

export default function ClientAppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <PushSessionBridge />
      {children}
    </AppShell>
  );
}
