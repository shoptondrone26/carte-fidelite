import type { GiftRarity, GiftRequestStatus } from "@/lib/gifts/types";

export const giftRarityLabelFr: Record<GiftRarity, string> = {
  rare: "Rare",
  premium: "Premium",
  elite: "Élite",
  legendary: "Légendaire",
};

export const giftStatusLabelFr: Record<GiftRequestStatus, string> = {
  pending: "En attente",
  accepted: "Accepté",
  refused: "Refusé",
  sent: "Envoyé",
  cancelled: "Annulé",
};

export const pointsReasonLabelFr: Record<string, string> = {
  unlock_reward: "Déblocage validé",
  referral_reward: "Parrainage",
  unlock_cancel: "Annulation déblocage",
  referral_cancel: "Annulation parrainage",
  gift_redeem: "Cadeau demandé",
  gift_refund: "Remboursement cadeau",
};

export function formatPoints(points: number): string {
  return new Intl.NumberFormat("fr-FR").format(points);
}

