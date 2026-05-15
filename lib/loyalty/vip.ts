export type VipLevel = "standard" | "bronze" | "or";

const VIP_THRESHOLDS: { min: number; level: VipLevel }[] = [
  { min: 15, level: "or" },
  { min: 5, level: "bronze" },
  { min: 0, level: "standard" },
];

const CYCLE_MAX = 3;

/** Moins de 5 déblocages = Standard, 5–14 = Bronze, 15+ = Or */
export function getVipLevel(totalUnlocks: number): VipLevel {
  const n = Math.max(0, Math.floor(totalUnlocks));
  for (const row of VIP_THRESHOLDS) {
    if (n >= row.min) {
      return row.level;
    }
  }
  return "standard";
}

export const vipLevelLabelFr: Record<VipLevel, string> = {
  standard: "Standard",
  bronze: "Bronze",
  or: "Or",
};

export type CycleProgress = {
  /** 0 = avant le 1er tampon ou cycle réinitialisé après un gratuit ; 1–3 = tampons du cycle */
  current: number;
  max: typeof CYCLE_MAX;
  label: string;
  percent: number;
  /** true quand le dernier déblocage a complété un cycle (3/3 → gratuit) */
  justCompletedFree: boolean;
};

/**
 * Cycle de 3 : 1/3, 2/3, 3/3 = gratuit, puis 0/3.
 * total_unlocks cumule ; l’affichage repart à 0/3 quand n est multiple de 3 (> 0).
 */
export function getCycleProgress(totalUnlocks: number): CycleProgress {
  const n = Math.max(0, Math.floor(totalUnlocks));
  const max = CYCLE_MAX;

  if (n <= 0) {
    return {
      current: 0,
      max,
      label: "0/3",
      percent: 0,
      justCompletedFree: false,
    };
  }

  const mod = n % max;
  if (mod === 0) {
    return {
      current: 0,
      max,
      label: "0/3",
      percent: 0,
      justCompletedFree: true,
    };
  }

  return {
    current: mod,
    max,
    label: `${mod}/3`,
    percent: (mod / max) * 100,
    justCompletedFree: false,
  };
}

/** Un gratuit tous les 3 déblocages validés. */
export function getFreeUnlocks(totalUnlocks: number): number {
  const n = Math.max(0, Math.floor(totalUnlocks));
  return Math.floor(n / CYCLE_MAX);
}

/** Tampons restants avant le prochain gratuit. */
export function getStampsUntilNextFree(totalUnlocks: number): number {
  const n = Math.max(0, Math.floor(totalUnlocks));
  if (n === 0) {
    return CYCLE_MAX;
  }
  const mod = n % CYCLE_MAX;
  return mod === 0 ? CYCLE_MAX : CYCLE_MAX - mod;
}
