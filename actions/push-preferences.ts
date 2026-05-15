"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type PushPreferenceResult =
  | { ok: true }
  | { ok: false; error: string };

export async function syncPushSubscriptionAction(
  subscriptionId: unknown,
): Promise<PushPreferenceResult> {
  const parsed = z.string().min(1).max(256).safeParse(subscriptionId);
  if (!parsed.success) {
    return { ok: false, error: "Abonnement invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Non connecté." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      onesignal_subscription_id: parsed.data,
      push_updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function setPushEnabledAction(
  enabled: unknown,
): Promise<PushPreferenceResult> {
  const parsed = z.boolean().safeParse(enabled);
  if (!parsed.success) {
    return { ok: false, error: "Valeur invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Non connecté." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      push_enabled: parsed.data,
      push_updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
