/** Statut commande boutique (futur). */
export type BoutiqueOrderStatus =
  | "draft"
  | "pending_payment"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type ShopProduct = {
  id: string;
  name: string;
  description: string | null;
  price_eur: number;
  stock: number;
  image_url: string | null;
  category: string;
  is_active: boolean;
  sort_order: number;
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

export type ProductsByCategory = {
  category: string;
  label: string;
  products: ShopProduct[];
};
