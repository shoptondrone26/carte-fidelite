import type { SupabaseClient } from "@supabase/supabase-js";

export type ClientHistoryItem = {
  id: string;
  event_type: string;
  created_at: string;
};

export type ClientFreeUsedItem = {
  id: string;
  created_at: string;
};

export type ClientLoyaltySnapshot = {
  totalUnlocks: number;
  historyItems: ClientHistoryItem[];
  freeUsedHistory: ClientFreeUsedItem[];
  freeUsedCount: number;
};

export function prependHistoryItem(
  items: ClientHistoryItem[],
  row: ClientHistoryItem,
  limit = 8,
): ClientHistoryItem[] {
  if (items.some((item) => item.id === row.id)) return items;
  return [row, ...items].slice(0, limit);
}

export function prependFreeUsedItem(
  items: ClientFreeUsedItem[],
  row: ClientFreeUsedItem,
  limit = 12,
): ClientFreeUsedItem[] {
  if (items.some((item) => item.id === row.id)) return items;
  return [row, ...items].slice(0, limit);
}

export function loyaltyChannelName(userId: string): string {
  return `loyalty:${userId}`;
}

export async function fetchClientLoyaltySnapshot(
  supabase: SupabaseClient,
  userId: string,
): Promise<ClientLoyaltySnapshot> {
  const [profileResult, historyResult, freeUsedHistoryResult, freeUsedCountResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("total_unlocks")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("history")
        .select("id, event_type, created_at")
        .eq("subject_id", userId)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("history")
        .select("id, created_at")
        .eq("subject_id", userId)
        .eq("event_type", "free_used")
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("history")
        .select("id", { count: "exact", head: true })
        .eq("subject_id", userId)
        .eq("event_type", "free_used"),
    ]);

  return {
    totalUnlocks: Number(profileResult.data?.total_unlocks ?? 0),
    historyItems: (historyResult.data ?? []) as ClientHistoryItem[],
    freeUsedHistory: (freeUsedHistoryResult.data ?? []) as ClientFreeUsedItem[],
    freeUsedCount: freeUsedCountResult.count ?? 0,
  };
}
