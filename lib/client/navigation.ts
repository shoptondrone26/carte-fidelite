import {
  Home,
  Settings,
  ShoppingBag,
  User2,
  type LucideIcon,
} from "lucide-react";

export type ClientNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  /** Autres chemins qui activent cet onglet (ex. déblocage sous Espace privé). */
  matchPrefixes?: readonly string[];
};

export const CLIENT_NAV_ITEMS: readonly ClientNavItem[] = [
  {
    href: "/",
    label: "Accueil",
    shortLabel: "Accueil",
    description: "Votre espace membre en un coup d’œil",
    icon: Home,
    matchPrefixes: ["/"],
  },
  {
    href: "/boutique",
    label: "Boutique",
    shortLabel: "Boutique",
    description: "Produits réservés aux membres",
    icon: ShoppingBag,
    matchPrefixes: ["/boutique"],
  },
  {
    href: "/dashboard",
    label: "Espace privé",
    shortLabel: "Espace privé",
    description: "Wallet, historique et fidélité",
    icon: User2,
    matchPrefixes: ["/dashboard", "/deblocage", "/carte", "/offres"],
  },
  {
    href: "/reglages",
    label: "Réglages",
    shortLabel: "Réglages",
    description: "Préférences du compte",
    icon: Settings,
    matchPrefixes: ["/reglages"],
  },
] as const;

export const CLIENT_PRIVATE_PATH_PREFIXES = [
  "/dashboard",
  "/deblocage",
  "/boutique",
  "/reglages",
] as const;

export function isClientPrivatePath(pathname: string): boolean {
  if (pathname === "/") return true;
  return CLIENT_PRIVATE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isClientNavActive(item: ClientNavItem, pathname: string): boolean {
  if (item.href === "/") {
    return pathname === "/";
  }
  const prefixes = item.matchPrefixes ?? [item.href];
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getClientNavTitle(pathname: string): string {
  if (pathname === "/") {
    return "Accueil";
  }
  if (pathname.startsWith("/deblocage")) {
    return "Espace privé";
  }
  if (pathname.startsWith("/boutique")) {
    return "Boutique";
  }
  const item = CLIENT_NAV_ITEMS.find((entry) =>
    isClientNavActive(entry, pathname),
  );
  return item?.label ?? "Espace privé";
}

export function getClientNavSubtitle(pathname: string): string {
  if (pathname === "/") {
    return "Votre espace membre en un coup d’œil";
  }
  if (pathname.startsWith("/deblocage")) {
    return "Réservation prioritaire";
  }
  if (pathname.startsWith("/boutique")) {
    return "Produits et commandes membres";
  }
  const item = CLIENT_NAV_ITEMS.find((entry) =>
    isClientNavActive(entry, pathname),
  );
  return item?.description ?? "Votre espace membre";
}
