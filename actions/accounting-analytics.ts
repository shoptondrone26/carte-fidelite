"use server";

import {
  fetchAdvancedAccountingAnalytics,
  type AdvancedAccountingAnalytics,
  type AnalyticsPeriodPreset,
} from "@/lib/admin/advanced-accounting-analytics";
import { getIsAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export type AdvancedAnalyticsActionResult =
  | { ok: true; data: AdvancedAccountingAnalytics }
  | { ok: false; error: string };

export async function fetchAdvancedAccountingAnalyticsAction(
  preset: AnalyticsPeriodPreset,
  customStart?: string,
  customEnd?: string,
): Promise<AdvancedAnalyticsActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await getIsAdmin(supabase, user.id))) {
    return { ok: false, error: "Accès réservé aux administrateurs." };
  }

  try {
    const data = await fetchAdvancedAccountingAnalytics(supabase, {
      preset,
      customStart,
      customEnd,
    });
    return { ok: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}
