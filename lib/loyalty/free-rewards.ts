import { getFreeUnlocks } from "@/lib/loyalty/vip";

/** Gratuits gagnés = floor(total_unlocks / 3). */
export function getFreeEarned(totalUnlocks: number): number {
  return getFreeUnlocks(totalUnlocks);
}

export function countFreeUsedInHistory(
  history: { event_type: string }[],
): number {
  return history.filter((row) => row.event_type === "free_used").length;
}

/** Gratuits encore disponibles (non consommés par l’admin). */
export function getFreeAvailable(earned: number, used: number): number {
  return Math.max(0, Math.floor(earned) - Math.floor(used));
}
