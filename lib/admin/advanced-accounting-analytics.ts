import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildRevenueBreakdown,
  type RevenueBreakdown,
} from "@/lib/admin/accounting";

export type AnalyticsPeriodPreset =
  | "today"
  | "7d"
  | "30d"
  | "3m"
  | "1y"
  | "all";

export type AdvancedAnalyticsFilters = {
  preset: AnalyticsPeriodPreset;
  customStart?: string;
  customEnd?: string;
};

export type AdvancedAnalyticsKpis = RevenueBreakdown & {
  bookingsCount: number;
  unlocksCount: number;
  phantomCount: number;
  shopOrdersCount: number;
  avgBasket: number;
  avgShopBasket: number;
};

export type AdvancedAnalyticsPoint = {
  dateKey: string;
  label: string;
  revenue: number;
  shop: number;
  unlocks: number;
  phantom: number;
  unlockCount: number;
  bookings: number;
  phantomCount: number;
};

export type AdvancedAccountingAnalytics = {
  preset: AnalyticsPeriodPreset;
  kpis: AdvancedAnalyticsKpis;
  series: AdvancedAnalyticsPoint[];
  customStart?: string;
  customEnd?: string;
};

type AmountRow = {
  amount_eur: number;
  action_type: string;
  created_at: string;
  profile_id: string;
};

type BookingRow = {
  created_at: string;
};

type BucketGranularity = "day" | "week" | "month";

function isUnlockTransaction(row: { action_type: string }): boolean {
  return (
    row.action_type === "paid_unlock" ||
    row.action_type === "unlock_cancellation"
  );
}

function isPhantomModeTransaction(row: { action_type: string }): boolean {
  return (
    row.action_type === "phantom_mode" ||
    row.action_type === "phantom_mode_cancellation"
  );
}

function isShopTransaction(row: { action_type: string }): boolean {
  return (
    row.action_type === "shop_order" ||
    row.action_type === "shop_order_cancellation"
  );
}

function transactionCountDelta(row: {
  amount_eur: number;
  action_type: string;
}): number {
  if (!isUnlockTransaction(row)) return 0;
  if (row.amount_eur > 0) return 1;
  if (row.amount_eur < 0) return -1;
  return 0;
}

function phantomCountDelta(row: {
  amount_eur: number;
  action_type: string;
}): number {
  if (!isPhantomModeTransaction(row)) return 0;
  if (row.amount_eur > 0) return 1;
  if (row.amount_eur < 0) return -1;
  return 0;
}

function shopOrderCountDelta(row: {
  amount_eur: number;
  action_type: string;
}): number {
  if (!isShopTransaction(row)) return 0;
  if (row.amount_eur > 0) return 1;
  if (row.amount_eur < 0) return -1;
  return 0;
}

function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toLocalMonthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function startOfWeekMonday(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  x.setDate(x.getDate() + (day === 0 ? -6 : 1 - day));
  return x;
}

function toWeekKey(d: Date): string {
  return toLocalDateKey(startOfWeekMonday(d));
}

function resolvePeriodRange(filters: AdvancedAnalyticsFilters): {
  start: Date | null;
  end: Date;
} {
  const end = filters.customEnd
    ? new Date(`${filters.customEnd}T23:59:59.999`)
    : new Date();

  if (filters.customStart) {
    return {
      start: new Date(`${filters.customStart}T00:00:00.000`),
      end,
    };
  }

  const now = new Date();
  switch (filters.preset) {
    case "today":
      return { start: startOfDay(now), end };
    case "7d": {
      const s = startOfDay(now);
      s.setDate(s.getDate() - 6);
      return { start: s, end };
    }
    case "30d": {
      const s = startOfDay(now);
      s.setDate(s.getDate() - 29);
      return { start: s, end };
    }
    case "3m": {
      const s = startOfDay(now);
      s.setMonth(s.getMonth() - 3);
      return { start: s, end };
    }
    case "1y": {
      const s = startOfDay(now);
      s.setFullYear(s.getFullYear() - 1);
      return { start: s, end };
    }
    case "all":
    default:
      return { start: null, end };
  }
}

function filterInRange(
  rows: AmountRow[],
  start: Date | null,
  end: Date,
): AmountRow[] {
  const endMs = end.getTime();
  const startMs = start?.getTime() ?? null;
  return rows.filter((row) => {
    const t = Date.parse(row.created_at);
    if (t > endMs) return false;
    if (startMs != null && t < startMs) return false;
    return true;
  });
}

function filterBookingsInRange(
  rows: BookingRow[],
  start: Date | null,
  end: Date,
): BookingRow[] {
  const endMs = end.getTime();
  const startMs = start?.getTime() ?? null;
  return rows.filter((row) => {
    const t = Date.parse(row.created_at);
    if (t > endMs) return false;
    if (startMs != null && t < startMs) return false;
    return true;
  });
}

function resolveGranularity(
  filters: AdvancedAnalyticsFilters,
  start: Date | null,
  end: Date,
): BucketGranularity {
  if (filters.preset === "1y" || filters.preset === "all") return "month";
  if (filters.preset === "3m") return "week";
  if (start == null) return "month";
  const daySpan = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daySpan > 90) return "month";
  if (daySpan > 31) return "week";
  return "day";
}

function bucketKey(d: Date, granularity: BucketGranularity): string {
  if (granularity === "month") return toLocalMonthKey(d);
  if (granularity === "week") return toWeekKey(d);
  return toLocalDateKey(d);
}

function bucketLabel(key: string, granularity: BucketGranularity): string {
  if (granularity === "month") {
    const [y, m] = key.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
  }
  if (granularity === "week") {
    const d = new Date(`${key}T12:00:00`);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }
  const d = new Date(`${key}T12:00:00`);
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
  });
}

function buildBucketSlots(
  start: Date | null,
  end: Date,
  granularity: BucketGranularity,
): { dateKey: string; label: string }[] {
  if (start == null) {
    return [];
  }

  const slots: { dateKey: string; label: string }[] = [];
  const cursor = new Date(start);

  if (granularity === "month") {
    cursor.setDate(1);
    while (cursor <= end) {
      const key = toLocalMonthKey(cursor);
      slots.push({ dateKey: key, label: bucketLabel(key, granularity) });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return slots;
  }

  if (granularity === "week") {
    const weekStart = startOfWeekMonday(cursor);
    while (weekStart <= end) {
      const key = toWeekKey(weekStart);
      if (!slots.some((s) => s.dateKey === key)) {
        slots.push({ dateKey: key, label: bucketLabel(key, granularity) });
      }
      weekStart.setDate(weekStart.getDate() + 7);
    }
    return slots;
  }

  while (cursor <= end) {
    const key = toLocalDateKey(cursor);
    slots.push({ dateKey: key, label: bucketLabel(key, granularity) });
    cursor.setDate(cursor.getDate() + 1);
  }
  return slots;
}

function buildSeriesFromData(
  txRows: AmountRow[],
  bookingRows: BookingRow[],
  start: Date | null,
  end: Date,
  granularity: BucketGranularity,
): AdvancedAnalyticsPoint[] {
  type Bucket = {
    revenue: number;
    shop: number;
    unlocks: number;
    phantom: number;
    unlockCount: number;
    bookings: number;
    phantomCount: number;
  };

  const buckets = new Map<string, Bucket>();

  for (const row of txRows) {
    const key = bucketKey(new Date(row.created_at), granularity);
    const cur = buckets.get(key) ?? {
      revenue: 0,
      shop: 0,
      unlocks: 0,
      phantom: 0,
      unlockCount: 0,
      bookings: 0,
      phantomCount: 0,
    };
    cur.revenue += row.amount_eur;
    if (isUnlockTransaction(row)) cur.unlocks += row.amount_eur;
    if (isPhantomModeTransaction(row)) cur.phantom += row.amount_eur;
    if (isShopTransaction(row)) cur.shop += row.amount_eur;
    cur.unlockCount += transactionCountDelta(row);
    cur.phantomCount += phantomCountDelta(row);
    buckets.set(key, cur);
  }

  for (const row of bookingRows) {
    const key = bucketKey(new Date(row.created_at), granularity);
    const cur = buckets.get(key) ?? {
      revenue: 0,
      shop: 0,
      unlocks: 0,
      phantom: 0,
      unlockCount: 0,
      bookings: 0,
      phantomCount: 0,
    };
    cur.bookings += 1;
    buckets.set(key, cur);
  }

  const slots = buildBucketSlots(start, end, granularity);
  if (slots.length === 0) {
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, v]) => ({
        dateKey,
        label: bucketLabel(dateKey, granularity),
        revenue: v.revenue,
        shop: v.shop,
        unlocks: v.unlocks,
        phantom: v.phantom,
        unlockCount: Math.max(0, v.unlockCount),
        bookings: v.bookings,
        phantomCount: Math.max(0, v.phantomCount),
      }));
  }

  return slots.map(({ dateKey, label }) => {
    const v = buckets.get(dateKey) ?? {
      revenue: 0,
      shop: 0,
      unlocks: 0,
      phantom: 0,
      unlockCount: 0,
      bookings: 0,
      phantomCount: 0,
    };
    return {
      dateKey,
      label,
      revenue: v.revenue,
      shop: v.shop,
      unlocks: v.unlocks,
      phantom: v.phantom,
      unlockCount: Math.max(0, v.unlockCount),
      bookings: v.bookings,
      phantomCount: Math.max(0, v.phantomCount),
    };
  });
}

function buildKpis(
  txRows: AmountRow[],
  bookingRows: BookingRow[],
): AdvancedAnalyticsKpis {
  const breakdown = buildRevenueBreakdown(txRows);
  const unlocksCount = Math.max(
    0,
    txRows.reduce((acc, row) => acc + transactionCountDelta(row), 0),
  );
  const phantomCount = Math.max(
    0,
    txRows.reduce((acc, row) => acc + phantomCountDelta(row), 0),
  );
  const shopOrdersCount = Math.max(
    0,
    txRows.reduce((acc, row) => acc + shopOrderCountDelta(row), 0),
  );

  return {
    ...breakdown,
    bookingsCount: bookingRows.length,
    unlocksCount,
    phantomCount,
    shopOrdersCount,
    avgBasket:
      unlocksCount > 0
        ? Math.round((breakdown.unlocks / unlocksCount) * 100) / 100
        : 0,
    avgShopBasket:
      shopOrdersCount > 0 && breakdown.shop > 0
        ? Math.round((breakdown.shop / shopOrdersCount) * 100) / 100
        : 0,
  };
}

async function fetchAllTransactions(
  supabase: SupabaseClient,
): Promise<AmountRow[]> {
  const { data, error } = await supabase
    .from("accounting_transactions")
    .select("amount_eur, action_type, created_at, profile_id")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as AmountRow[]).map((row) => ({
    ...row,
    amount_eur: Number(row.amount_eur),
  }));
}

async function fetchAllBookings(
  supabase: SupabaseClient,
): Promise<BookingRow[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as BookingRow[];
}

export async function fetchAdvancedAccountingAnalytics(
  supabase: SupabaseClient,
  filters: AdvancedAnalyticsFilters,
): Promise<AdvancedAccountingAnalytics> {
  const [allTx, allBookings] = await Promise.all([
    fetchAllTransactions(supabase),
    fetchAllBookings(supabase),
  ]);

  const { start, end } = resolvePeriodRange(filters);
  const txRows = filterInRange(allTx, start, end);
  const bookingRows = filterBookingsInRange(allBookings, start, end);
  const granularity = resolveGranularity(filters, start, end);

  const effectiveStart =
    start ??
    (allTx.length > 0
      ? startOfDay(
          new Date(allTx[allTx.length - 1]!.created_at),
        )
      : startOfDay());

  const series = buildSeriesFromData(
    txRows,
    bookingRows,
    filters.preset === "all" ? effectiveStart : start,
    end,
    granularity,
  );

  return {
    preset: filters.preset,
    kpis: buildKpis(txRows, bookingRows),
    series,
    customStart: filters.customStart,
    customEnd: filters.customEnd,
  };
}
