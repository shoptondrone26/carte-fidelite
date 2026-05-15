import { getVipLevel } from "@/lib/loyalty/vip";

import type { PushKind } from "@/lib/onesignal/messages";

export function loyaltyPushKindsAfterUnlock(
  previousTotal: number,
  nextTotal: number,
): { kind: PushKind; payload: Record<string, unknown> }[] {
  const events: { kind: PushKind; payload: Record<string, unknown> }[] = [];
  const prev = Math.max(0, Math.floor(previousTotal));
  const next = Math.max(0, Math.floor(nextTotal));

  if (next > 0 && next % 3 === 0 && next !== prev) {
    events.push({ kind: "free_available", payload: { total_unlocks: next } });
  }

  const prevVip = getVipLevel(prev);
  const nextVip = getVipLevel(next);
  if (nextVip !== prevVip) {
    events.push({
      kind: "vip_changed",
      payload: { vip_level: nextVip, previous_vip: prevVip },
    });
  }

  return events;
}
