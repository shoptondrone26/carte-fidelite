export type GiftRarity = "rare" | "premium" | "elite" | "legendary";

export type GiftCatalogItem = {
  id: string;
  name: string;
  description: string;
  points_price: number;
  real_cost_eur: number;
  image_url: string | null;
  rarity: GiftRarity;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type GiftRequestStatus =
  | "pending"
  | "accepted"
  | "refused"
  | "sent"
  | "cancelled";

export type GiftRequest = {
  id: string;
  profile_id: string;
  gift_id: string;
  points_spent: number;
  status: GiftRequestStatus;
  tracking_number: string | null;
  admin_note: string | null;
  sent_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
  gift: GiftCatalogItem | null;
};

export type PointsLedgerEntry = {
  id: string;
  profile_id: string;
  points_delta: number;
  reason: string;
  source_profile_id: string | null;
  source_history_id: string | null;
  gift_request_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ClientPointsSnapshot = {
  pointsBalance: number;
  referralCode: string | null;
  referredBy: string | null;
  gifts: GiftCatalogItem[];
  requests: GiftRequest[];
  ledger: PointsLedgerEntry[];
  leaderboard: LeaderboardEntry[];
  personalRank: number | null;
};

export type LeaderboardEntry = {
  profile_id: string;
  name: string;
  points: number;
};

