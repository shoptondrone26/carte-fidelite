import { PackageSearch, Settings, ShoppingBag, Wallet, type LucideIcon } from "lucide-react";

export type ClientNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  /** Autres chemins qui activent cet onglet (ex. déblocage sous Carte). */
  matchPrefixes?: readonly string[];
};

export const CLIENT_NAV_ITEMS: readonly ClientNavItem[] = [
  {
    href: "/dashboard",
    label: "Carte",
    shortLabel: "Carte",
    description: "Réservation, wallet et historique",
    icon: Wallet,
    matchPrefixes: ["/dashboard", "/deblocage"],
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
    href: "/suivi-colis",
    label: "Suivi colis",
    shortLabel: "Suivi colis",
    description: "Suivi Chronopost de vos commandes",
    icon: PackageSearch,
    matchPrefixes: ["/suivi-colis"],
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
  "/suivi-colis",
  "/reglages",
] as const;

export function isClientPrivatePath(pathname: string): boolean {
  return CLIENT_PRIVATE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isClientNavActive(item: ClientNavItem, pathname: string): boolean {
  const prefixes = item.matchPrefixes ?? [item.href];
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getClientNavTitle(pathname: string): string {
  if (pathname.startsWith("/deblocage")) {
    return "Espace privé";
  }
  if (pathname.startsWith("/boutique")) {
    return "Boutique";
  }
  if (pathname.startsWith("/suivi-colis")) {
    return "Suivi colis";
  }
  const item = CLIENT_NAV_ITEMS.find((entry) =>
    isClientNavActive(entry, pathname),
  );
  return item?.label === "Carte" ? "Espace privé" : (item?.label ?? "Espace privé");
}

export function getClientNavSubtitle(pathname: string): string {
  if (pathname.startsWith("/deblocage")) {
    return "Réservation prioritaire";
  }
  if (pathname.startsWith("/boutique")) {
    return "Produits et commandes membres";
  }
  if (pathname.startsWith("/suivi-colis")) {
    return "Suivi Chronopost de vos commandes";
  }
  const item = CLIENT_NAV_ITEMS.find((entry) =>
    isClientNavActive(entry, pathname),
  );
  return item?.description ?? "Votre espace membre";
}
