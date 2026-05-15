import type { ReactNode } from "react";

import { AdminHeader } from "@/components/admin/admin-header";

type AdminShellProps = {
  adminDisplayName: string;
  children: ReactNode;
};

export function AdminShell({ adminDisplayName, children }: AdminShellProps) {
  return (
    <div className="flex min-h-dvh flex-col pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <AdminHeader adminDisplayName={adminDisplayName} />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-5 pb-10 pt-6">
        {children}
      </main>
    </div>
  );
}
