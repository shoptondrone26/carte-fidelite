"use server";

import { revalidatePath } from "next/cache";

import { bookingIdSchema } from "@/schemas/bookings";
import { trackServerAnalyticsEvent } from "@/lib/analytics/server";
import { getIsAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export type AdminBookingActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function acceptBookingAction(
  rawId: unknown,
): Promise<AdminBookingActionResult> {
  const parsed = bookingIdSchema.safeParse(rawId);
  if (!parsed.success) {
    return { ok: false, error: "Réservation invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await getIsAdmin(supabase, user.id))) {
    return { ok: false, error: "Accès réservé aux administrateurs." };
  }

  const { error } = await supabase.rpc("accept_booking", {
    p_booking_id: parsed.data,
  });

  if (error) {
    if (error.message.includes("invalid_state")) {
      return {
        ok: false,
        error: "Cette demande a déjà été traitée ou annulée.",
      };
    }
    if (error.message.includes("forbidden")) {
      return { ok: false, error: "Action non autorisée." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/deblocage");
  revalidatePath("/dashboard");
  revalidatePath("/admin/reservations");
  await trackServerAnalyticsEvent("booking_accepted", {
    booking_id: parsed.data,
  });

  return { ok: true };
}

export async function refuseBookingAction(
  rawId: unknown,
): Promise<AdminBookingActionResult> {
  const parsed = bookingIdSchema.safeParse(rawId);
  if (!parsed.success) {
    return { ok: false, error: "Réservation invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await getIsAdmin(supabase, user.id))) {
    return { ok: false, error: "Accès réservé aux administrateurs." };
  }

  const { error } = await supabase.rpc("refuse_booking", {
    p_booking_id: parsed.data,
  });

  if (error) {
    if (error.message.includes("invalid_state")) {
      return {
        ok: false,
        error: "Cette demande a déjà été traitée ou annulée.",
      };
    }
    if (error.message.includes("forbidden")) {
      return { ok: false, error: "Action non autorisée." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/deblocage");
  revalidatePath("/dashboard");
  revalidatePath("/admin/reservations");
  await trackServerAnalyticsEvent("booking_refused", {
    booking_id: parsed.data,
  });

  return { ok: true };
}

export async function cancelAdminBookingAction(
  rawId: unknown,
): Promise<AdminBookingActionResult> {
  const parsed = bookingIdSchema.safeParse(rawId);
  if (!parsed.success) {
    return { ok: false, error: "Réservation invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await getIsAdmin(supabase, user.id))) {
    return { ok: false, error: "Accès réservé aux administrateurs." };
  }

  const { error } = await supabase.rpc("admin_cancel_booking", {
    p_booking_id: parsed.data,
  });

  if (error) {
    if (error.message.includes("invalid_state")) {
      return {
        ok: false,
        error: "Cette réservation ne peut plus être annulée.",
      };
    }
    if (error.message.includes("not_found")) {
      return { ok: false, error: "Réservation introuvable." };
    }
    if (error.message.includes("forbidden")) {
      return { ok: false, error: "Action non autorisée." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/reservations");
  revalidatePath("/admin/history");
  revalidatePath("/deblocage");
  revalidatePath("/dashboard");

  return { ok: true };
}
