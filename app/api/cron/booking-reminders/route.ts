import { NextRequest, NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/api/cron-auth";
import { formatSlotDateTime } from "@/lib/booking/format";
import { enqueuePush } from "@/lib/onesignal/send";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Rappel ~2 h avant le créneau (status accepted). */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = Date.now();
  const windowStart = new Date(now + 115 * 60_000).toISOString();
  const windowEnd = new Date(now + 125 * 60_000).toISOString();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, profile_id, starts_at")
    .eq("status", "accepted")
    .gte("starts_at", windowStart)
    .lte("starts_at", windowEnd);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let queued = 0;

  for (const b of bookings ?? []) {
    const { data: already } = await supabase
      .from("booking_reminder_sent")
      .select("booking_id")
      .eq("booking_id", b.id)
      .maybeSingle();

    if (already) continue;

    await enqueuePush({
      userId: b.profile_id,
      kind: "booking_reminder",
      dedupeKey: `reminder:${b.id}`,
      payload: {
        slot_label: formatSlotDateTime(b.starts_at),
        booking_id: b.id,
      },
    });

    await supabase.from("booking_reminder_sent").insert({ booking_id: b.id });
    queued += 1;
  }

  return NextResponse.json({
    ok: true,
    scanned: bookings?.length ?? 0,
    queued,
  });
}
