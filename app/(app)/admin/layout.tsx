import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin/require-admin";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { displayName } = await requireAdmin("/admin");

  return (
    <AdminShell adminDisplayName={displayName}>
      {children}
    </AdminShell>
  );
}
