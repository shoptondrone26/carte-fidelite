import type { ReactNode } from "react";

import { ClientAppChrome } from "@/components/client/client-app-chrome";
import { ClientAnalyticsTracker } from "@/components/analytics/client-analytics-tracker";
import { AppShell } from "@/components/layout/app-shell";
import { PushSessionBridge } from "@/components/notifications/push-session-bridge";

export default function ClientAppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <ClientAnalyticsTracker />
      <PushSessionBridge />
      <ClientAppChrome>{children}</ClientAppChrome>
    </AppShell>
  );
}
