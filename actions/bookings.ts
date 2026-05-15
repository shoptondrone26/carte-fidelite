"use server";

import { revalidatePath } from "next/cache";

import { bookingIdSchema, slotStartSchema } from "@/schemas/bookings";
import { createClient } from "@/lib/supabase/server";

export type BookingActionResult =
  | {
      ok: true;
      booking?: { id: string; created_at: string; starts_at: string };
    }
  | { ok: false; error: string };

export async function createPendingBookingAction(
  rawSlotStart: unknown,
): Promise<BookingActionResult> {
  const parsed = slotStartSchema.safeParse(rawSlotStart);
  if (!parsed.success) {
    return { ok: false, error: "Créneau invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Vous devez être connecté." };
  }

  const { data: rows, error } = await supabase.rpc("create_pending_booking", {
    p_slot_start: parsed.data,
    p_notes: null,
  });

  if (error) {
    const msg = error.message;
    if (
      msg.includes("déjà une demande") ||
      msg.includes("déjà réservé") ||
      error.code === "23505"
    ) {
      return {
        ok: false,
        error:
          msg.includes("réservé") || error.code === "23505"
            ? "Ce créneau n’est plus disponible."
            : "Vous avez déjà une demande en attente.",
      };
    }
    return { ok: false, error: msg };
  }

  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row?.id) {
    return { ok: false, error: "Réservation impossible." };
  }

  revalidatePath("/deblocage");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/reservations");

  return {
    ok: true,
    booking: {
      id: row.id as string,
      created_at: row.created_at as string,
      starts_at: row.starts_at as string,
    },
  };
}

export async function cancelPendingBookingAction(
  rawId: unknown,
): Promise<BookingActionResult> {
  const parsed = bookingIdSchema.safeParse(rawId);
  if (!parsed.success) {
    return { ok: false, error: "Demande invalide." };
  }
  const bookingId = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Vous devez être connecté." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("bookings")
    .select("id, status, profile_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, error: "Demande introuvable." };
  }
  if (existing.profile_id !== user.id) {
    return { ok: false, error: "Accès refusé." };
  }
  if (existing.status !== "pending") {
    return { ok: false, error: "Cette demande ne peut plus être annulée." };
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("status", "pending");

  if (error) {
    return { ok: false, error: error.message };
  }

  await supabase.from("history").insert({
    subject_id: user.id,
    actor_id: user.id,
    event_type: "booking_cancelled",
    entity_type: "booking",
    entity_id: bookingId,
    payload: { booking_id: bookingId },
  });

  revalidatePath("/deblocage");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/reservations");

  return { ok: true };
}
