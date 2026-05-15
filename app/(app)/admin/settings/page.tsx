import type { Metadata } from "next";

import { AdminPlaceholderView } from "@/components/admin/views/admin-placeholder-view";
import { requireAdmin } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paramètres",
};

export default async function AdminSettingsPage() {
  await requireAdmin("/admin/settings");

  return (
    <AdminPlaceholderView
      title="Paramètres"
      description="Configuration de l’établissement, notifications et préférences admin à venir."
    />
  );
}
