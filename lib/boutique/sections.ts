import {
  History,
  Package,
  ShoppingBag,
  Truck,
  type LucideIcon,
} from "lucide-react";

import type { BoutiqueModuleId, BoutiqueSnapshot } from "@/lib/boutique/types";

export type BoutiqueModule = {
  id: BoutiqueModuleId;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Route future (non branchée). */
  futureHref: string;
  metricLabel: string;
  metricValue: (snapshot: BoutiqueSnapshot) => number;
};

export const BOUTIQUE_MODULES: readonly BoutiqueModule[] = [
  {
    id: "products",
    title: "Produits",
    description: "Catalogue réservé aux membres ShopTonDrone Privé.",
    icon: Package,
    futureHref: "/boutique/produits",
    metricLabel: "Articles",
    metricValue: (s) => s.productsCount,
  },
  {
    id: "orders",
    title: "Commandes",
    description: "Passez et gérez vos commandes en quelques gestes.",
    icon: ShoppingBag,
    futureHref: "/boutique/commandes",
    metricLabel: "Total",
    metricValue: (s) => s.ordersCount,
  },
  {
    id: "tracking",
    title: "Suivi",
    description: "Suivez la préparation et l’expédition en temps réel.",
    icon: Truck,
    futureHref: "/boutique/suivi",
    metricLabel: "En cours",
    metricValue: (s) => s.activeOrdersCount,
  },
  {
    id: "history",
    title: "Historique",
    description: "Retrouvez toutes vos commandes passées.",
    icon: History,
    futureHref: "/boutique/historique",
    metricLabel: "Archives",
    metricValue: (s) => s.historyCount,
  },
] as const;
