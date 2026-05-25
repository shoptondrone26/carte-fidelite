import {
  Calculator,
  CalendarDays,
  History,
  LayoutDashboard,
  PackageSearch,
  Settings,
  ShoppingBag,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  /** Libellé court pour la barre de navigation horizontale */
  shortLabel: string;
  description: string;
  icon: LucideIcon;
};

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    shortLabel: "Accueil",
    description: "Vue d’ensemble et indicateurs",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/clients",
    label: "Carnet clients",
    shortLabel: "Clients",
    description: "Fidélité et déblocages",
    icon: Users,
  },
  {
    href: "/admin/compta",
    label: "Comptabilité",
    shortLabel: "Compta",
    description: "Suivi financier",
    icon: Calculator,
  },
  {
    href: "/admin/boutique",
    label: "Boutique",
    shortLabel: "Boutique",
    description: "Catalogue produits",
    icon: ShoppingBag,
  },
  {
    href: "/admin/suivi-colis",
    label: "Suivi colis",
    shortLabel: "Colis",
    description: "Expéditions Chronopost",
    icon: PackageSearch,
  },
  {
    href: "/admin/history",
    label: "Historique",
    shortLabel: "Historique",
    description: "Tous les événements",
    icon: History,
  },
  {
    href: "/admin/reservations",
    label: "Réservations",
    shortLabel: "Réserv.",
    description: "Demandes et validations",
    icon: CalendarDays,
  },
  {
    href: "/admin/settings",
    label: "Paramètres",
    shortLabel: "Réglages",
    description: "Configuration",
    icon: Settings,
  },
] as const;

export function getAdminNavTitle(pathname: string): string {
  if (pathname === "/admin") return "Dashboard";
  const item = ADMIN_NAV_ITEMS.find(
    (n) => n.href !== "/admin" && pathname.startsWith(n.href),
  );
  return item?.label ?? "Administration";
}

export function isAdminDashboard(pathname: string): boolean {
  return pathname === "/admin";
}

export function isAdminNavActive(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
