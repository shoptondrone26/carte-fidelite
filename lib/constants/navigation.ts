import { Crown, Gem, Home, UserRound } from "lucide-react";

import type { NavItem } from "@/types";

export const MOBILE_NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/carte", label: "Avantages", icon: Gem },
  { href: "/offres", label: "Privilèges", icon: Crown },
  { href: "/dashboard", label: "Espace privé", icon: UserRound },
] as const;
