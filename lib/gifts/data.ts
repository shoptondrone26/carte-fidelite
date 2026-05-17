import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ClientPointsSnapshot,
  GiftCatalogItem,
  GiftRequest,
  LeaderboardEntry,
  PointsLedgerEntry,
} from "@/lib/gifts/types";

type GiftRequestRow = Omit<GiftRequest, "gift"> & {
  gift_catalog: GiftCatalogItem | GiftCatalogItem[] | null;
};

type LeaderboardProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

function mapGiftRequest(row: GiftRequestRow): GiftRequest {
  const gift = Array.isArray(row.gift_catalog)
    ? row.gift_catalog[0] ?? null
    : row.gift_catalog;

  return {
    id: row.id,
    profile_id: row.profile_id,
    gift_id: row.gift_id,
    points_spent: row.points_spent,
    status: row.status,
    tracking_number: row.tracking_number,
    admin_note: row.admin_note,
    sent_at: row.sent_at,
    refunded_at: row.refunded_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    gift,
  };
}

function monthStartIso(): string {
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

function displayName(profile: LeaderboardProfile | undefined): string {
  return profile?.full_name?.trim() || profile?.email?.split("@")[0] || "Membre";
}

export async function fetchClientPointsSnapshot(
  supabase: SupabaseClient,
  userId: string,
): Promise<ClientPointsSnapshot> {
  const [
    profileRes,
    giftsRes,
    requestsRes,
    ledgerRes,
    monthlyLedgerRes,
    profilesRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("points_balance, referral_code, referred_by")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("gift_catalog")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("gift_requests")
      .select("*, gift_catalog(*)")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("points_ledger")
      .select("*")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("points_ledger")
      .select("profile_id, points_delta")
      .gt("points_delta", 0)
      .gte("created_at", monthStartIso()),
    supabase.from("profiles").select("id, full_name, email"),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (giftsRes.error) throw giftsRes.error;
  if (requestsRes.error) throw requestsRes.error;
  if (ledgerRes.error) throw ledgerRes.error;
  if (monthlyLedgerRes.error) throw monthlyLedgerRes.error;
  if (profilesRes.error) throw profilesRes.error;

  const profiles = new Map(
    ((profilesRes.data ?? []) as LeaderboardProfile[]).map((p) => [p.id, p]),
  );
  const pointsByClient = new Map<string, number>();
  for (const row of (monthlyLedgerRes.data ?? []) as {
    profile_id: string;
    points_delta: number;
  }[]) {
    pointsByClient.set(
      row.profile_id,
      (pointsByClient.get(row.profile_id) ?? 0) + row.points_delta,
    );
  }

  const leaderboard: LeaderboardEntry[] = [...pointsByClient.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([profileId, points]) => ({
      profile_id: profileId,
      name: displayName(profiles.get(profileId)),
      points,
    }));

  const fullRank = [...pointsByClient.entries()].sort((a, b) => b[1] - a[1]);
  const personalRankIndex = fullRank.findIndex(([profileId]) => profileId === userId);

  return {
    pointsBalance: profileRes.data?.points_balance ?? 0,
    referralCode: profileRes.data?.referral_code ?? null,
    referredBy: profileRes.data?.referred_by ?? null,
    gifts: (giftsRes.data ?? []) as GiftCatalogItem[],
    requests: ((requestsRes.data ?? []) as GiftRequestRow[]).map(mapGiftRequest),
    ledger: (ledgerRes.data ?? []) as PointsLedgerEntry[],
    leaderboard,
    personalRank: personalRankIndex >= 0 ? personalRankIndex + 1 : null,
  };
}

