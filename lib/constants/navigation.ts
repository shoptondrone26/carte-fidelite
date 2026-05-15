import { CreditCard, Gift, Home, User } from "lucide-react";

import type { NavItem } from "@/types";

export const MOBILE_NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/carte", label: "Carte", icon: CreditCard },
  { href: "/offres", label: "Offres", icon: Gift },
  { href: "/dashboard", label: "Compte", icon: User },
] as const;
