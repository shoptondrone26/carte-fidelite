import type { ReactNode } from "react";

import { ClientAnalyticsTracker } from "@/components/analytics/client-analytics-tracker";
import { AppShell } from "@/components/layout/app-shell";
import { PushSessionBridge } from "@/components/notifications/push-session-bridge";

export default function ClientAppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <ClientAnalyticsTracker />
      <PushSessionBridge />
      {children}
    </AppShell>
  );
}
