"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getIsAdmin } from "@/lib/auth/roles";
import {
  fetchClientPhantomRequest,
  type PhantomRequest,
  type PhantomRequestStatus,
} from "@/lib/phantom/requests";
import { createClient } from "@/lib/supabase/server";

const requestIdSchema = z.string().uuid();
const adminStatusSchema = z.enum([
  "accepted",
  "payment_pending",
  "paid",
  "in_progress",
  "refused",
  "cancelled",
]);

export type PhantomActionResult =
  | { ok: true; request?: PhantomRequest }
  | { ok: false; error: string };

export async function createPhantomRequestAction(): Promise<PhantomActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Connexion requise." };
  }

  const { error } = await supabase.rpc("create_phantom_request");

  if (error) {
    if (error.message.includes("active_request_exists")) {
      return { ok: false, error: "Une demande Mode Fantôme est déjà en cours." };
    }
    if (error.message.includes("client_only")) {
      return { ok: false, error: "Action réservée aux clients." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/history");

  const request = await fetchClientPhantomRequest(supabase, user.id);
  return request ? { ok: true, request } : { ok: true };
}

export async function updatePhantomRequestStatusAction(
  rawRequestId: unknown,
  rawStatus: unknown,
): Promise<PhantomActionResult> {
  const parsedId = requestIdSchema.safeParse(rawRequestId);
  const parsedStatus = adminStatusSchema.safeParse(rawStatus);
  if (!parsedId.success || !parsedStatus.success) {
    return { ok: false, error: "Demande Mode Fantôme invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await getIsAdmin(supabase, user.id))) {
    return { ok: false, error: "Accès réservé aux administrateurs." };
  }

  const status: Exclude<PhantomRequestStatus, "pending" | "completed"> =
    parsedStatus.data;
  const { error } = await supabase.rpc("admin_update_phantom_request_status", {
    p_request_id: parsedId.data,
    p_status: status,
  });

  if (error) {
    if (error.message.includes("invalid_state")) {
      return { ok: false, error: "Cette demande ne peut plus être modifiée." };
    }
    if (error.message.includes("not_found")) {
      return { ok: false, error: "Demande introuvable." };
    }
    if (error.message.includes("forbidden")) {
      return { ok: false, error: "Action non autorisée." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/history");
  revalidatePath("/dashboard");

  return { ok: true };
}

export async function completePhantomRequestAction(
  rawRequestId: unknown,
): Promise<PhantomActionResult> {
  const parsedId = requestIdSchema.safeParse(rawRequestId);
  if (!parsedId.success) {
    return { ok: false, error: "Demande Mode Fantôme invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await getIsAdmin(supabase, user.id))) {
    return { ok: false, error: "Accès réservé aux administrateurs." };
  }

  const { error } = await supabase.rpc("complete_phantom_request", {
    p_request_id: parsedId.data,
  });

  if (error) {
    if (error.message.includes("already_completed")) {
      return { ok: false, error: "Ce Mode Fantôme est déjà terminé." };
    }
    if (error.message.includes("invalid_state")) {
      return {
        ok: false,
        error: "Confirmez d’abord le paiement avant de terminer.",
      };
    }
    if (error.message.includes("not_found")) {
      return { ok: false, error: "Demande introuvable." };
    }
    if (error.message.includes("forbidden")) {
      return { ok: false, error: "Action non autorisée." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/history");
  revalidatePath("/dashboard");

  return { ok: true };
}
