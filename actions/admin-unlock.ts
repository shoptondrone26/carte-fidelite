"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getIsAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const profileIdSchema = z.string().uuid();
const amountEurSchema = z.union([z.literal(150), z.literal(200)]);

export type ValidateUnlockResult =
  | { ok: true }
  | { ok: false; error: string };

export async function validateUnlockAction(
  rawProfileId: unknown,
  rawAmountEur?: unknown,
): Promise<ValidateUnlockResult> {
  const parsedProfile = profileIdSchema.safeParse(rawProfileId);
  if (!parsedProfile.success) {
    return { ok: false, error: "Client invalide." };
  }

  const parsedAmount = amountEurSchema.safeParse(rawAmountEur);
  if (!parsedAmount.success) {
    return {
      ok: false,
      error: "Choisissez un montant : 150 € ou 200 €.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await getIsAdmin(supabase, user.id))) {
    return { ok: false, error: "Accès réservé aux administrateurs." };
  }

  const { error } = await supabase.rpc("validate_unlock", {
    p_profile_id: parsedProfile.data,
    p_amount_eur: parsedAmount.data,
  });

  if (error) {
    if (error.message.includes("forbidden")) {
      return { ok: false, error: "Action non autorisée." };
    }
    if (error.message.includes("not_found")) {
      return { ok: false, error: "Client introuvable." };
    }
    if (error.message.includes("invalid_amount")) {
      return { ok: false, error: "Montant invalide. Choisissez 150 € ou 200 €." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/compta");
  revalidatePath("/dashboard");
  revalidatePath("/deblocage");

  return { ok: true };
}
