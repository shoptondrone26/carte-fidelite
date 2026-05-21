import { getSiteUrl, isOneSignalSendEnabled } from "@/lib/onesignal/config";
import { sendDirectPushToUser } from "@/lib/onesignal/direct-send";
import {
  buildPushMessage,
  type PushKind,
} from "@/lib/onesignal/messages";
import { createServiceClient } from "@/lib/supabase/service";

type SendPushOptions = {
  userId: string;
  kind: PushKind;
  payload?: Record<string, unknown>;
  dedupeKey?: string;
};

export async function enqueuePush({
  userId,
  kind,
  payload = {},
  dedupeKey,
}: SendPushOptions): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return;

  const supabase = createServiceClient();
  const key = dedupeKey ?? `${kind}:${userId}:${Date.now()}`;

  const { error } = await supabase.from("notification_outbox").upsert(
    {
      user_id: userId,
      kind,
      dedupe_key: key,
      payload,
    },
    { onConflict: "dedupe_key", ignoreDuplicates: true },
  );

  if (error) {
    console.error("enqueuePush", error.message);
  }
}

export async function sendPushNow({
  userId,
  kind,
  payload = {},
}: Omit<SendPushOptions, "dedupeKey">): Promise<{ ok: boolean; error?: string }> {
  if (!isOneSignalSendEnabled()) {
    return { ok: false, error: "onesignal_disabled" };
  }

  const message = buildPushMessage(kind, getSiteUrl(), payload);

  const result = await sendDirectPushToUser(userId, {
    title: message.title,
    body: message.body,
    url: message.url,
  });

  if (!result.ok) {
    return {
      ok: false,
      error: result.skipped ? "push_disabled" : result.error,
    };
  }

  return { ok: true };
}

export async function processOutboxBatch(limit = 25): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  if (!isOneSignalSendEnabled()) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  const supabase = createServiceClient();
  const { data: rows } = await supabase
    .from("notification_outbox")
    .select("id, user_id, kind, payload")
    .is("sent_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (!rows?.length) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const result = await sendPushNow({
      userId: row.user_id,
      kind: row.kind as PushKind,
      payload: (row.payload as Record<string, unknown>) ?? {},
    });

    if (result.ok) {
      sent += 1;
      await supabase
        .from("notification_outbox")
        .update({ sent_at: new Date().toISOString(), error: null })
        .eq("id", row.id);
    } else if (result.error === "push_disabled") {
      await supabase
        .from("notification_outbox")
        .update({
          sent_at: new Date().toISOString(),
          error: "push_disabled",
        })
        .eq("id", row.id);
    } else {
      failed += 1;
      await supabase
        .from("notification_outbox")
        .update({ error: result.error ?? "send_failed" })
        .eq("id", row.id);
    }
  }

  return { processed: rows.length, sent, failed };
}
