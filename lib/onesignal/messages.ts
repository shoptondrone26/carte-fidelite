import { vipLevelLabelFr, type VipLevel } from "@/lib/loyalty/vip";

export type PushKind =
  | "booking_accepted"
  | "booking_refused"
  | "free_available"
  | "vip_changed"
  | "booking_reminder";

export type PushMessage = {
  title: string;
  body: string;
  url: string;
};

export function buildPushMessage(
  kind: PushKind,
  siteUrl: string,
  payload: Record<string, unknown> = {},
): PushMessage {
  const base = siteUrl.replace(/\/$/, "");

  switch (kind) {
    case "booking_accepted":
      return {
        title: "Réservation acceptée",
        body: "Votre créneau a été validé par l’établissement.",
        url: `${base}/deblocage`,
      };
    case "booking_refused":
      return {
        title: "Réservation refusée",
        body: "Vous pouvez choisir un autre créneau.",
        url: `${base}/deblocage`,
      };
    case "free_available":
      return {
        title: "Gratuit disponible",
        body: "Un avantage gratuit est prêt sur votre carte.",
        url: `${base}/dashboard`,
      };
    case "vip_changed": {
      const level = payload.vip_level as VipLevel | undefined;
      const label = level ? vipLevelLabelFr[level] : "nouveau";
      return {
        title: "Niveau VIP mis à jour",
        body: `Vous êtes maintenant VIP ${label}.`,
        url: `${base}/dashboard`,
      };
    }
    case "booking_reminder": {
      const slot = payload.slot_label as string | undefined;
      return {
        title: "Rappel de réservation",
        body: slot
          ? `Votre créneau approche : ${slot}.`
          : "Votre créneau approche dans environ 2 heures.",
        url: `${base}/deblocage`,
      };
    }
    default:
      return {
        title: "Carte",
        body: "Vous avez une nouvelle notification.",
        url: `${base}/dashboard`,
      };
  }
}
