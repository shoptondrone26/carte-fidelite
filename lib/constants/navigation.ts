import { Home, UserRound } from "lucide-react";

import type { NavItem } from "@/types";

/** Bottom navigation client (Accueil + Espace privé). /carte et /offres restent accessibles en direct. */
export const MOBILE_NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/dashboard", label: "Espace privé", icon: UserRound },
] as const;
