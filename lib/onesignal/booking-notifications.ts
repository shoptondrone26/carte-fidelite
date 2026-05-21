import { formatSlotDateTime } from "@/lib/booking/format";
import { getSiteUrl, isOneSignalSendEnabled } from "@/lib/onesignal/config";
import {
  sendDirectPushToAdmins,
  sendDirectPushToUser,
} from "@/lib/onesignal/direct-send";
import { createServiceClient } from "@/lib/supabase/service";

function logPushFailure(context: string, detail: string): void {
  // eslint-disable-next-line no-console -- erreur non bloquante
  console.error(`[booking-push:${context}]`, detail);
}

/** Exécution fire-and-forget : ne bloque jamais l’action réservation. */
function runBookingPush(task: () => Promise<void>): void {
  if (!isOneSignalSendEnabled()) return;
  void task().catch((err) => {
    logPushFailure(
      "unhandled",
      err instanceof Error ? err.message : String(err),
    );
  });
}

function clientDisplayName(
  fullName: string | null | undefined,
): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return "Un client";
  const first = trimmed.split(/\s+/)[0];
  return first || "Un client";
}

async function loadBookingContext(bookingId: string): Promise<{
  profileId: string;
  startsAt: string;
  clientName: string;
} | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return null;

  const supabase = createServiceClient();
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("profile_id, starts_at")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError || !booking?.profile_id || !booking.starts_at) {
    if (bookingError) logPushFailure("load_booking", bookingError.message);
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", booking.profile_id)
    .maybeSingle();

  return {
    profileId: booking.profile_id,
    startsAt: booking.starts_at,
    clientName: clientDisplayName(profile?.full_name),
  };
}

const adminReservationsUrl = () => `${getSiteUrl().replace(/\/$/, "")}/admin/reservations`;
const clientDeblocageUrl = () => `${getSiteUrl().replace(/\/$/, "")}/deblocage`;

/** Nouvelle demande pending → tous les admins. */
export function notifyAdminsNewPendingBooking(input: {
  bookingId: string;
  startsAt: string;
  clientProfileId: string;
}): void {
  runBookingPush(async () => {
    let clientName = "Un client";
    if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      const supabase = createServiceClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", input.clientProfileId)
        .maybeSingle();
      clientName = clientDisplayName(profile?.full_name);
    }

    const slotLabel = formatSlotDateTime(input.startsAt);
    const body = `Un client vient de demander un créneau. ${clientName} — ${slotLabel}`;

    const batch = await sendDirectPushToAdmins({
      title: "Nouvelle réservation",
      body,
      url: adminReservationsUrl(),
    });

    if (batch.sent === 0 && batch.failed > 0) {
      logPushFailure(
        `new_booking:${input.bookingId}`,
        batch.errors[0] ?? "aucun admin notifié",
      );
    }
  });
}

/** Réservation acceptée → client. */
export function notifyClientBookingAccepted(bookingId: string): void {
  runBookingPush(async () => {
    const ctx = await loadBookingContext(bookingId);
    if (!ctx) return;

    const result = await sendDirectPushToUser(ctx.profileId, {
      title: "Réservation acceptée",
      body: "Votre créneau a été confirmé par ShopTonDrone.",
      url: clientDeblocageUrl(),
    });

    if (!result.ok && !result.skipped) {
      logPushFailure(`accepted:${bookingId}`, result.error);
    }
  });
}

/** Refus ou annulation admin → client. */
export function notifyClientBookingCancelled(bookingId: string): void {
  runBookingPush(async () => {
    const ctx = await loadBookingContext(bookingId);
    if (!ctx) return;

    const result = await sendDirectPushToUser(ctx.profileId, {
      title: "Réservation annulée",
      body: "Votre réservation a été annulée. Vous pouvez demander un nouveau créneau.",
      url: clientDeblocageUrl(),
    });

    if (!result.ok && !result.skipped) {
      logPushFailure(`cancelled:${bookingId}`, result.error);
    }
  });
}
