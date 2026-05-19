/** Statut commande boutique (futur). */
export type BoutiqueOrderStatus =
  | "draft"
  | "pending_payment"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type BoutiqueProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_eur: number;
  image_url: string | null;
  is_active: boolean;
};

export type BoutiqueOrder = {
  id: string;
  profile_id: string;
  status: BoutiqueOrderStatus;
  total_eur: number;
  created_at: string;
  updated_at: string;
};

export type BoutiqueSnapshot = {
  productsCount: number;
  ordersCount: number;
  activeOrdersCount: number;
  historyCount: number;
};

export type BoutiqueModuleId =
  | "products"
  | "orders"
  | "tracking"
  | "history";
