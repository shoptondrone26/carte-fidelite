import {
  CalendarDays,
  Crown,
  Diamond,
  type LucideIcon,
} from "lucide-react";

export type PrivilegeDefinition = {
  title: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const vipPrivileges: PrivilegeDefinition[] = [
  {
    title: "Drop membre privé",
    label: "Accès limité",
    description: "Des avantages rares proposés en priorité aux membres actifs.",
    icon: Diamond,
  },
  {
    title: "Expérience privée",
    label: "Réservé membres",
    description: "Un accès pensé pour prolonger l’univers ShopTonDrone Privé.",
    icon: Crown,
  },
  {
    title: "Réservation VIP",
    label: "Prioritaire",
    description: "Une expérience rapide, fluide et privilégiée.",
    icon: CalendarDays,
  },
];

export const limitedRewards = [
  "Avantage exclusif",
  "Disponible pour une durée limitée",
  "Récompense spéciale",
] as const;

export const knownPrivilegeNames = [
  ...vipPrivileges.map((privilege) => privilege.title),
  ...limitedRewards,
];

