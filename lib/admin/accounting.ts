import type { SupabaseClient } from "@supabase/supabase-js";

export const UNLOCK_AMOUNTS_EUR = [150, 200] as const;

export type UnlockAmountEur = (typeof UNLOCK_AMOUNTS_EUR)[number];

export type RevenueBreakdown = {
  total: number;
  unlocks: number;
  phantom: number;
  shop: number;
};

export type PeriodRevenueKpi = RevenueBreakdown & {
  /** Variation vs période précédente équivalente (%), null si non comparable. */
  changePercent: number | null;
};

export type AccountingSummary = {
  revenueTotal: number;
  revenueUnlocks: number;
  revenuePhantom: number;
  revenueShop: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  today: PeriodRevenueKpi;
  week: PeriodRevenueKpi;
  month: PeriodRevenueKpi;
  paidUnlocksCount: number;
  paidUnlocksToday: number;
  phantomModeCount: number;
  shopOrdersCompletedCount: number;
  /** Panier moyen des ventes boutique comptabilisées (commandes terminées). */
  avgShopBasket: number;
  freeUsedCount: number;
  /** Panier moyen déblocages payants. */
  avgBasket: number;
};

export type AccountingLedgerEntry = {
  id: string;
  amount_eur: number;
  action_type: string;
  created_at: string;
  profile_id: string;
  actor_id: string;
  client_name: string;
  actor_name: string;
  product_name: string | null;
  /** Détail produits (commandes boutique multi-lignes). */
  products_label: string | null;
  /** Statut commande au moment de l'écriture (terminée / annulée). */
  order_status_label: string | null;
};

export type ClientSpendStats = {
  totalSpentEur: number;
  paidUnlocksCount: number;
  freeUsedCount: number;
};

export type TopClientByRevenue = {
  profile_id: string;
  full_name: string | null;
  email: string | null;
  total_spent_eur: number;
  paid_unlocks_count: number;
};

export type DailyMetricPoint = {
  dateKey: string;
  label: string;
  revenue: number;
  unlocks: number;
};

export type MonthlyMetricPoint = {
  monthKey: string;
  label: string;
  revenue: number;
  unlocks: number;
};

export type TopClientChartPoint = {
  name: string;
  revenue: number;
};

export type AccountingAnalytics = {
  dailyLast7: DailyMetricPoint[];
  monthlyLast6: MonthlyMetricPoint[];
  topClientsChart: TopClientChartPoint[];
};

type AmountRow = {
  amount_eur: number;
  action_type: string;
  created_at: string;
  profile_id: string;
};

type ShopOrderItemLedgerRow = {
  product_name: string;
  quantity: number;
  sort_order: number;
};

type ShopOrderLedgerJoin = {
  product_name: string;
  status: string;
  shop_order_items?: ShopOrderItemLedgerRow[] | ShopOrderItemLedgerRow[] | null;
};

type LedgerRow = {
  id: string;
  amount_eur: number | string;
  action_type: string;
  created_at: string;
  profile_id: string;
  actor_id: string;
  shop_order_id: string | null;
  shop_orders: ShopOrderLedgerJoin | ShopOrderLedgerJoin[] | null;
};

type DayBucket = { revenue: number; unlocks: number };

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

function groupByLocalDay(rows: AmountRow[]): Map<string, DayBucket> {
  const map = new Map<string, DayBucket>();
  for (const row of rows) {
    const key = toLocalDateKey(new Date(row.created_at));
    const cur = map.get(key) ?? { revenue: 0, unlocks: 0 };
    cur.revenue += row.amount_eur;
    cur.unlocks += transactionCountDelta(row);
    map.set(key, cur);
  }
  return map;
}

function groupByLocalMonth(rows: AmountRow[]): Map<string, DayBucket> {
  const map = new Map<string, DayBucket>();
  for (const row of rows) {
    const key = toLocalMonthKey(new Date(row.created_at));
    const cur = map.get(key) ?? { revenue: 0, unlocks: 0 };
    cur.revenue += row.amount_eur;
    cur.unlocks += transactionCountDelta(row);
    map.set(key, cur);
  }
  return map;
}

function buildLast7DaySlots(): { dateKey: string; label: string }[] {
  const slots: { dateKey: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    slots.push({
      dateKey: toLocalDateKey(d),
      label: d.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
      }),
    });
  }
  return slots;
}

function buildLast6MonthSlots(): { monthKey: string; label: string }[] {
  const slots: { monthKey: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - i);
    slots.push({
      monthKey: toLocalMonthKey(d),
      label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
    });
  }
  return slots;
}

export function buildAccountingAnalytics(
  rows: AmountRow[],
  topClients: TopClientByRevenue[],
): AccountingAnalytics {
  const byDay = groupByLocalDay(rows);
  const byMonth = groupByLocalMonth(rows);

  const dailyLast7 = buildLast7DaySlots().map(({ dateKey, label }) => {
    const v = byDay.get(dateKey) ?? { revenue: 0, unlocks: 0 };
    return {
      dateKey,
      label,
      revenue: v.revenue,
      unlocks: Math.max(0, v.unlocks),
    };
  });

  const monthlyLast6 = buildLast6MonthSlots().map(({ monthKey, label }) => {
    const v = byMonth.get(monthKey) ?? { revenue: 0, unlocks: 0 };
    return {
      monthKey,
      label,
      revenue: v.revenue,
      unlocks: Math.max(0, v.unlocks),
    };
  });

  const topClientsChart = topClients.slice(0, 8).map((c) => {
    const raw = c.full_name?.trim() || c.email?.trim() || "Client";
    return {
      name: raw.length > 14 ? `${raw.slice(0, 12)}…` : raw,
      revenue: c.total_spent_eur,
    };
  });

  return { dailyLast7, monthlyLast6, topClientsChart };
}

function startOfDay(d = new Date()): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function startOfDaysAgo(daysAgo: number, d = new Date()): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - daysAgo);
  return x.toISOString();
}

/** 7 derniers jours calendaires incluant aujourd'hui (J-6 → maintenant). */
function startOfRolling7Days(d = new Date()): string {
  return startOfDaysAgo(6, d);
}

function startOfMonth(d = new Date()): string {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function sumAmounts(rows: { amount_eur: number }[]): number {
  return rows.reduce((acc, row) => acc + row.amount_eur, 0);
}

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

function transactionCountDelta(row: {
  amount_eur: number;
  action_type: string;
}): number {
  if (!isUnlockTransaction(row)) return 0;
  if (row.amount_eur > 0) return 1;
  if (row.amount_eur < 0) return -1;
  return 0;
}

function netPaidUnlocks(
  rows: { amount_eur: number; action_type: string }[],
): number {
  return rows.reduce(
    (acc, row) => acc + transactionCountDelta(row),
    0,
  );
}

function completedPhantomModes(rows: AmountRow[]): number {
  return Math.max(
    0,
    rows
      .filter(isPhantomModeTransaction)
      .reduce(
        (count, row) =>
          count + (row.amount_eur > 0 ? 1 : row.amount_eur < 0 ? -1 : 0),
        0,
      ),
  );
}

function filterSince(rows: AmountRow[], sinceIso: string): AmountRow[] {
  const since = Date.parse(sinceIso);
  return rows.filter((r) => Date.parse(r.created_at) >= since);
}

function filterBetween(
  rows: AmountRow[],
  startIso: string,
  endIso: string,
): AmountRow[] {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  return rows.filter((r) => {
    const t = Date.parse(r.created_at);
    return t >= start && t < end;
  });
}

function isShopTransaction(row: { action_type: string }): boolean {
  return (
    row.action_type === "shop_order" ||
    row.action_type === "shop_order_cancellation"
  );
}

function completedShopOrders(rows: AmountRow[]): number {
  return Math.max(
    0,
    rows
      .filter(isShopTransaction)
      .reduce(
        (count, row) =>
          count + (row.amount_eur > 0 ? 1 : row.amount_eur < 0 ? -1 : 0),
        0,
      ),
  );
}

/**
 * Panier moyen boutique net = CA boutique net / commandes terminées nettes.
 * Les contre-écritures (shop_order_cancellation) annulent vente + compteur.
 */
function avgShopBasketEur(rows: AmountRow[]): number {
  const netOrders = completedShopOrders(rows);
  if (netOrders <= 0) return 0;

  const netRevenue = buildRevenueBreakdown(rows).shop;
  if (netRevenue <= 0) return 0;

  return Math.round((netRevenue / netOrders) * 100) / 100;
}

function unwrapShopOrder(
  shopOrder: ShopOrderLedgerJoin | ShopOrderLedgerJoin[] | null,
): ShopOrderLedgerJoin | null {
  if (!shopOrder) return null;
  return Array.isArray(shopOrder) ? (shopOrder[0] ?? null) : shopOrder;
}

export function formatShopOrderProductsLabel(
  order: ShopOrderLedgerJoin | null,
): string | null {
  if (!order) return null;

  const rawItems = order.shop_order_items;
  const items = (Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  if (items.length > 0) {
    return items
      .map((item) =>
        item.quantity > 1
          ? `${item.product_name} × ${item.quantity}`
          : item.product_name,
      )
      .join(", ");
  }

  return order.product_name?.trim() || null;
}

export function shopLedgerOrderStatusLabel(
  actionType: string,
): string | null {
  if (actionType === "shop_order_cancellation") return "Annulée";
  if (actionType === "shop_order") return "Terminée";
  return null;
}

export function buildRevenueBreakdown(rows: AmountRow[]): RevenueBreakdown {
  let unlocks = 0;
  let phantom = 0;
  let shop = 0;

  for (const row of rows) {
    if (isUnlockTransaction(row)) {
      unlocks += row.amount_eur;
    } else if (isPhantomModeTransaction(row)) {
      phantom += row.amount_eur;
    } else if (isShopTransaction(row)) {
      shop += row.amount_eur;
    }
  }

  return {
    total: unlocks + phantom + shop,
    unlocks,
    phantom,
    shop,
  };
}

function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) {
    return current > 0 ? null : null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

function periodKpi(
  currentRows: AmountRow[],
  previousRows: AmountRow[],
): PeriodRevenueKpi {
  const current = buildRevenueBreakdown(currentRows);
  const previous = buildRevenueBreakdown(previousRows);
  return {
    ...current,
    changePercent: percentChange(current.total, previous.total),
  };
}

export function formatEur(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const hasCents = Math.round(rounded * 100) % 100 !== 0;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: hasCents ? 2 : 0,
    minimumFractionDigits: hasCents ? 2 : 0,
  }).format(rounded);
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

export async function fetchAccountingSummary(
  supabase: SupabaseClient,
): Promise<AccountingSummary> {
  const [rows, freeUsedResult] = await Promise.all([
    fetchAllTransactions(supabase),
    supabase
      .from("history")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "free_used"),
  ]);

  const todayStart = startOfDay();
  const yesterdayStart = startOfDaysAgo(1);
  const weekStart = startOfRolling7Days();
  const prevWeekStart = startOfDaysAgo(13);
  const prevWeekEnd = startOfDaysAgo(6);
  const monthStart = startOfMonth();
  const prevMonthStart = (() => {
    const x = new Date();
    x.setDate(1);
    x.setHours(0, 0, 0, 0);
    x.setMonth(x.getMonth() - 1);
    return x.toISOString();
  })();
  const prevMonthEnd = monthStart;

  const todayRows = filterSince(rows, todayStart);
  const yesterdayRows = filterBetween(rows, yesterdayStart, todayStart);
  const weekRows = filterSince(rows, weekStart);
  const prevWeekRows = filterBetween(rows, prevWeekStart, prevWeekEnd);
  const monthRows = filterSince(rows, monthStart);
  const prevMonthRows = filterBetween(rows, prevMonthStart, prevMonthEnd);

  const today = periodKpi(todayRows, yesterdayRows);
  const week = periodKpi(weekRows, prevWeekRows);
  const month = periodKpi(monthRows, prevMonthRows);

  const unlockRows = rows.filter(isUnlockTransaction);
  const phantomRows = rows.filter(isPhantomModeTransaction);
  const shopRows = rows.filter(isShopTransaction);
  const revenueUnlocks = sumAmounts(unlockRows);
  const revenuePhantom = sumAmounts(phantomRows);
  const revenueShop = sumAmounts(shopRows);
  const revenueTotal = revenueUnlocks + revenuePhantom + revenueShop;
  const paidUnlocksCount = Math.max(0, netPaidUnlocks(rows));
  const shopCompletedCount = completedShopOrders(rows);

  return {
    revenueTotal,
    revenueUnlocks,
    revenuePhantom,
    revenueShop,
    revenueToday: today.total,
    revenueWeek: week.total,
    revenueMonth: month.total,
    today,
    week,
    month,
    paidUnlocksCount,
    paidUnlocksToday: Math.max(0, netPaidUnlocks(todayRows)),
    phantomModeCount: completedPhantomModes(rows),
    shopOrdersCompletedCount: shopCompletedCount,
    avgShopBasket: avgShopBasketEur(rows),
    freeUsedCount: freeUsedResult.count ?? 0,
    avgBasket:
      paidUnlocksCount > 0 ? Math.round(revenueUnlocks / paidUnlocksCount) : 0,
  };
}

export async function fetchAccountingLedger(
  supabase: SupabaseClient,
  limit = 50,
): Promise<AccountingLedgerEntry[]> {
  const { data: txRows, error: txError } = await supabase
    .from("accounting_transactions")
    .select(
      "id, amount_eur, action_type, created_at, profile_id, actor_id, shop_order_id, shop_orders(product_name, status, shop_order_items(product_name, quantity, sort_order))",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (txError) throw txError;
  const transactions = (txRows ?? []) as LedgerRow[];
  if (transactions.length === 0) return [];

  const profileIds = new Set<string>();
  for (const row of transactions) {
    profileIds.add(row.profile_id);
    profileIds.add(row.actor_id);
  }

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", [...profileIds]);

  if (profileError) throw profileError;

  const nameById = new Map<string, string>();
  for (const p of profiles ?? []) {
    nameById.set(
      p.id,
      p.full_name?.trim() || p.email?.trim() || "—",
    );
  }

  return transactions.map((row) => {
    const shopOrder = unwrapShopOrder(row.shop_orders);
    const productsLabel = isShopTransaction(row)
      ? formatShopOrderProductsLabel(shopOrder)
      : null;
    const productName =
      productsLabel ??
      (shopOrder?.product_name?.trim() || null);

    return {
      id: row.id,
      amount_eur: Number(row.amount_eur),
      action_type: row.action_type,
      created_at: row.created_at,
      profile_id: row.profile_id,
      actor_id: row.actor_id,
      client_name: nameById.get(row.profile_id) ?? "Client",
      actor_name: nameById.get(row.actor_id) ?? "Admin",
      product_name: productName,
      products_label: productsLabel,
      order_status_label: shopLedgerOrderStatusLabel(row.action_type),
    };
  });
}

export async function fetchClientSpendStats(
  supabase: SupabaseClient,
  profileId: string,
  freeUsedCount = 0,
): Promise<ClientSpendStats> {
  const { data, error } = await supabase
    .from("accounting_transactions")
    .select("amount_eur, action_type")
    .eq("profile_id", profileId);

  if (error) throw error;
  const rows = data ?? [];

  return {
    totalSpentEur: sumAmounts(rows),
    paidUnlocksCount: Math.max(0, netPaidUnlocks(rows)),
    freeUsedCount,
  };
}

export async function fetchSpendByClient(
  supabase: SupabaseClient,
): Promise<Record<string, ClientSpendStats>> {
  const { data, error } = await supabase
    .from("accounting_transactions")
    .select("profile_id, amount_eur, action_type");

  if (error) throw error;

  const map: Record<string, ClientSpendStats> = {};
  for (const row of data ?? []) {
    const current = map[row.profile_id] ?? {
      totalSpentEur: 0,
      paidUnlocksCount: 0,
      freeUsedCount: 0,
    };
    current.totalSpentEur += row.amount_eur;
    current.paidUnlocksCount += transactionCountDelta(row);
    map[row.profile_id] = current;
  }
  for (const stats of Object.values(map)) {
    stats.paidUnlocksCount = Math.max(0, stats.paidUnlocksCount);
  }
  return map;
}

export async function fetchTopClientsByRevenue(
  supabase: SupabaseClient,
  limit = 10,
): Promise<TopClientByRevenue[]> {
  const { data: txRows, error: txError } = await supabase
    .from("accounting_transactions")
    .select("profile_id, amount_eur, action_type");

  if (txError) throw txError;

  const totals = new Map<string, { sum: number; count: number }>();
  for (const row of txRows ?? []) {
    const cur = totals.get(row.profile_id) ?? { sum: 0, count: 0 };
    cur.sum += row.amount_eur;
    cur.count += transactionCountDelta(row);
    totals.set(row.profile_id, cur);
  }

  const ranked = [...totals.entries()]
    .map(([profileId, stats]) => [
      profileId,
      { sum: stats.sum, count: Math.max(0, stats.count) },
    ] as const)
    .filter(([, stats]) => stats.sum > 0 || stats.count > 0)
    .sort((a, b) => b[1].sum - a[1].sum)
    .slice(0, limit);

  if (ranked.length === 0) return [];

  const profileIds = ranked.map(([id]) => id);
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", profileIds);

  if (profileError) throw profileError;

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return ranked.map(([profile_id, stats]) => {
    const p = profileById.get(profile_id);
    return {
      profile_id,
      full_name: p?.full_name ?? null,
      email: p?.email ?? null,
      total_spent_eur: stats.sum,
      paid_unlocks_count: stats.count,
    };
  });
}

export async function fetchAccountingAnalytics(
  supabase: SupabaseClient,
): Promise<AccountingAnalytics> {
  const [rows, topClients] = await Promise.all([
    fetchAllTransactions(supabase),
    fetchTopClientsByRevenue(supabase, 8),
  ]);
  return buildAccountingAnalytics(rows, topClients);
}
