import type { Metadata } from "next";

import { AdminAnalyseLive } from "@/components/admin/views/admin-analyse-live";
import { fetchAdminAnalytics } from "@/lib/admin/analytics";
import { requireAdmin } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analyse",
};

export default async function AdminAnalysePage() {
  const { supabase } = await requireAdmin("/admin/analyse");
  const analytics = await fetchAdminAnalytics(supabase);

  return <AdminAnalyseLive initial={analytics} />;
}

