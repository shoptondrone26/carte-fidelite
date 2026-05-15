"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getIsAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const profileIdSchema = z.string().uuid();

export type MarkFreeUsedResult =
  | { ok: true }
  | { ok: false; error: string };

export async function markFreeUsedAction(
  rawProfileId: unknown,
): Promise<MarkFreeUsedResult> {
  const parsed = profileIdSchema.safeParse(rawProfileId);
  if (!parsed.success) {
    return { ok: false, error: "Client invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await getIsAdmin(supabase, user.id))) {
    return { ok: false, error: "Accès réservé aux administrateurs." };
  }

  const { error } = await supabase.rpc("mark_free_used", {
    p_profile_id: parsed.data,
  });

  if (error) {
    if (error.message.includes("forbidden")) {
      return { ok: false, error: "Action non autorisée." };
    }
    if (error.message.includes("not_found")) {
      return { ok: false, error: "Client introuvable." };
    }
    if (error.message.includes("no_free_available")) {
      return {
        ok: false,
        error: "Aucun gratuit disponible pour ce client.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/deblocage");

  return { ok: true };
}
