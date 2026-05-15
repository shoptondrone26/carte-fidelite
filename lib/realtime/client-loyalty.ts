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
