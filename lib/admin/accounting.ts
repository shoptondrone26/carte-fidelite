import type { SupabaseClient } from "@supabase/supabase-js";

export const UNLOCK_AMOUNTS_EUR = [150, 200] as const;

export type UnlockAmountEur = (typeof UNLOCK_AMOUNTS_EUR)[number];

export type AccountingSummary = {
  revenueTotal: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  paidUnlocksCount: number;
  paidUnlocksToday: number;
  phantomRevenueTotal: number;
  phantomRevenueMonth: number;
  phantomCompletedCount: number;
  freeUsedCount: number;
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
    cur.unlocks += accountingUnlockDelta(row);
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
    cur.unlocks += accountingUnlockDelta(row);
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

/** Semaine calendaire : lundi 00:00 (heure locale). */
function startOfWeek(d = new Date()): string {
  const x = new Date(d);
  const day = x.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + mondayOffset);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
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

function accountingUnlockDelta(row: {
  amount_eur: number;
  action_type?: string;
}): number {
  if (row.action_type === "phantom_mode") return 0;
  return row.amount_eur > 0 ? 1 : row.amount_eur < 0 ? -1 : 0;
}

function isUnlockAccountingRow(row: { action_type?: string }): boolean {
  return row.action_type !== "phantom_mode";
}

function netPaidUnlocks(rows: { amount_eur: number; action_type?: string }[]): number {
  return rows.reduce((acc, row) => acc + accountingUnlockDelta(row), 0);
}

function filterSince(rows: AmountRow[], sinceIso: string): AmountRow[] {
  const since = Date.parse(sinceIso);
  return rows.filter((r) => Date.parse(r.created_at) >= since);
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

async function fetchAllTransactions(
  supabase: SupabaseClient,
): Promise<AmountRow[]> {
  const { data, error } = await supabase
    .from("accounting_transactions")
    .select("amount_eur, action_type, created_at, profile_id")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AmountRow[];
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
  const weekStart = startOfWeek();
  const monthStart = startOfMonth();

  const todayRows = filterSince(rows, todayStart);
  const weekRows = filterSince(rows, weekStart);
  const monthRows = filterSince(rows, monthStart);
  const unlockRows = rows.filter(isUnlockAccountingRow);
  const phantomRows = rows.filter((row) => row.action_type === "phantom_mode");
  const phantomMonthRows = monthRows.filter(
    (row) => row.action_type === "phantom_mode",
  );

  const revenueTotal = sumAmounts(rows);
  const paidUnlocksCount = Math.max(0, netPaidUnlocks(unlockRows));
  const unlockRevenueTotal = sumAmounts(unlockRows);

  return {
    revenueTotal,
    revenueToday: sumAmounts(todayRows),
    revenueWeek: sumAmounts(weekRows),
    revenueMonth: sumAmounts(monthRows),
    paidUnlocksCount,
    paidUnlocksToday: Math.max(0, netPaidUnlocks(todayRows)),
    phantomRevenueTotal: sumAmounts(phantomRows),
    phantomRevenueMonth: sumAmounts(phantomMonthRows),
    phantomCompletedCount: phantomRows.filter((row) => row.amount_eur > 0).length,
    freeUsedCount: freeUsedResult.count ?? 0,
    avgBasket:
      paidUnlocksCount > 0
        ? Math.round(unlockRevenueTotal / paidUnlocksCount)
        : 0,
  };
}

export async function fetchAccountingLedger(
  supabase: SupabaseClient,
  limit = 50,
): Promise<AccountingLedgerEntry[]> {
  const { data: txRows, error: txError } = await supabase
    .from("accounting_transactions")
    .select("id, amount_eur, action_type, created_at, profile_id, actor_id")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (txError) throw txError;
  const transactions = txRows ?? [];
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

  return transactions.map((row) => ({
    id: row.id,
    amount_eur: row.amount_eur,
    action_type: row.action_type,
    created_at: row.created_at,
    profile_id: row.profile_id,
    actor_id: row.actor_id,
    client_name: nameById.get(row.profile_id) ?? "Client",
    actor_name: nameById.get(row.actor_id) ?? "Admin",
  }));
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
    current.paidUnlocksCount += accountingUnlockDelta(row);
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
    .select("profile_id, amount_eur");

  if (txError) throw txError;

  const totals = new Map<string, { sum: number; count: number }>();
  for (const row of txRows ?? []) {
    const cur = totals.get(row.profile_id) ?? { sum: 0, count: 0 };
    cur.sum += row.amount_eur;
    cur.count += accountingUnlockDelta(row);
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
