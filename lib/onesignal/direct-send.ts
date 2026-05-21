import {
  postOneSignalNotification,
  type OneSignalSendDebug,
} from "@/lib/onesignal/api-request";
import {
  isOneSignalSendEnabled,
  logOneSignalEnvDebug,
} from "@/lib/onesignal/config";
import { createServiceClient } from "@/lib/supabase/service";

export type DirectPushMessage = {
  title: string;
  body: string;
  /** Chemin relatif ou URL absolue */
  url?: string;
};

export type DirectPushResult =
  | { ok: true }
  | { ok: false; error: string; skipped?: boolean; debug?: OneSignalSendDebug };

const TEST_COOLDOWN_MS = 60_000;

declare global {
  // eslint-disable-next-line no-var
  var __pushTestCooldown: Map<string, number> | undefined;
}

function getCooldownMap(): Map<string, number> {
  if (!globalThis.__pushTestCooldown) {
    globalThis.__pushTestCooldown = new Map();
  }
  return globalThis.__pushTestCooldown;
}

export function isPushTestRateLimited(userId: string): boolean {
  const last = getCooldownMap().get(userId);
  return last != null && Date.now() - last < TEST_COOLDOWN_MS;
}

export function markPushTestSent(userId: string): void {
  getCooldownMap().set(userId, Date.now());
}

async function profileAcceptsPush(userId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("profiles")
    .select("push_enabled")
    .eq("id", userId)
    .maybeSingle();

  return data?.push_enabled !== false;
}

/**
 * Envoie une notification push (external_id = UUID profil Supabase).
 */
export async function sendDirectPushToUser(
  userId: string,
  message: DirectPushMessage,
): Promise<DirectPushResult> {
  if (!isOneSignalSendEnabled()) {
    logOneSignalEnvDebug("sendDirectPushToUser:disabled");
    return { ok: false, error: "onesignal_disabled" };
  }

  if (!(await profileAcceptsPush(userId))) {
    return { ok: false, error: "push_disabled", skipped: true };
  }

  const result = await postOneSignalNotification({
    userId,
    title: message.title,
    body: message.body,
    url: message.url,
  });

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      debug: result.debug,
    };
  }

  return { ok: true };
}

export async function fetchAdminProfileIds(): Promise<string[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return [];

  const supabase = createServiceClient();
  const { data: roleRow } = await supabase
    .from("roles")
    .select("id")
    .eq("slug", "admin")
    .maybeSingle();

  if (!roleRow?.id) return [];

  const { data: links } = await supabase
    .from("user_roles")
    .select("profile_id")
    .eq("role_id", roleRow.id);

  return [...new Set((links ?? []).map((r) => r.profile_id as string))];
}

export async function sendDirectPushToAdmins(
  message: DirectPushMessage,
  options?: { excludeUserId?: string },
): Promise<{ sent: number; failed: number; skipped: number; errors: string[] }> {
  const ids = await fetchAdminProfileIds();
  const targets = options?.excludeUserId
    ? ids.filter((id) => id !== options.excludeUserId)
    : ids;

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const userId of targets) {
    const result = await sendDirectPushToUser(userId, message);
    if (result.ok) {
      sent += 1;
    } else if (result.skipped) {
      skipped += 1;
    } else {
      failed += 1;
      if (result.error) errors.push(`${userId.slice(0, 8)}: ${result.error}`);
    }
  }

  return { sent, failed, skipped, errors };
}
