import type { SupabaseClient } from "@supabase/supabase-js";

import { knownPrivilegeNames } from "@/lib/analytics/privileges";

export type AnalyticsKpi = {
  label: string;
  value: number | string;
  detail: string;
  tone: "amber" | "emerald" | "violet" | "rose";
};

export type AnalyticsChartPoint = {
  label: string;
  value: number;
  secondary?: number;
};

export type AnalyticsNamedMetric = {
  name: string;
  value: number;
  detail?: string;
};

export type AnalyticsRealtimeEvent = {
  id: string;
  event_type: string;
  created_at: string;
  label: string;
};

export type AdminAnalyticsSnapshot = {
  users: {
    kpis: AnalyticsKpi[];
    activityLast7: AnalyticsChartPoint[];
  };
  reservations: {
    kpis: AnalyticsKpi[];
    popularSlots: AnalyticsChartPoint[];
    popularDays: AnalyticsChartPoint[];
    statusSplit: AnalyticsChartPoint[];
  };
  loyalty: {
    kpis: AnalyticsKpi[];
    topClients: AnalyticsNamedMetric[];
    progressAverage: number;
  };
  privileges: {
    kpis: AnalyticsKpi[];
    opened: AnalyticsNamedMetric[];
    used: AnalyticsNamedMetric[];
    neverUsed: string[];
  };
  realtime: AnalyticsRealtimeEvent[];
};

type AnalyticsEventRow = {
  id: string;
  user_id: string | null;
  event_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type BookingRow = {
  status: string;
  created_at: string;
  starts_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  total_unlocks: number | null;
  created_at: string;
};

type HistoryRow = {
  subject_id: string | null;
  event_type: string;
  created_at: string;
};

function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d = new Date()): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  x.setDate(x.getDate() + (day === 0 ? -6 : 1 - day));
  return x;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function isSince(iso: string, since: Date): boolean {
  return Date.parse(iso) >= since.getTime();
}

function distinctUsers(rows: AnalyticsEventRow[]): number {
  return new Set(rows.map((row) => row.user_id).filter(Boolean)).size;
}

function countBy<T>(
  rows: T[],
  keyFn: (row: T) => string | null | undefined,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function topFromMap(map: Map<string, number>, limit: number): AnalyticsNamedMetric[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));
}

function buildLast7Activity(events: AnalyticsEventRow[]): AnalyticsChartPoint[] {
  const buckets = new Map<string, { events: number; users: Set<string> }>();
  for (let i = 6; i >= 0; i--) {
    const d = startOfDay();
    d.setDate(d.getDate() - i);
    buckets.set(dateKey(d), { events: 0, users: new Set<string>() });
  }

  for (const event of events) {
    const key = dateKey(new Date(event.created_at));
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.events += 1;
    if (event.user_id) bucket.users.add(event.user_id);
  }

  return [...buckets.entries()].map(([key, bucket]) => {
    const d = new Date(`${key}T12:00:00`);
    return {
      label: d.toLocaleDateString("fr-FR", { weekday: "short" }),
      value: bucket.events,
      secondary: bucket.users.size,
    };
  });
}

function chartFromMap(map: Map<string, number>, limit: number): AnalyticsChartPoint[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

function displayClient(profile: ProfileRow): string {
  return profile.full_name?.trim() || profile.email?.trim() || profile.id.slice(0, 8);
}

function eventLabel(row: AnalyticsEventRow): string {
  const name = String(row.metadata?.name ?? "").trim();
  const labels: Record<string, string> = {
    app_open: "Ouverture app",
    dashboard_open: "Dashboard client",
    booking_created: "Réservation créée",
    booking_accepted: "Réservation acceptée",
    booking_refused: "Réservation refusée",
    unlock_validated: "Déblocage validé",
    privilege_opened: name ? `Privilège ouvert: ${name}` : "Privilège ouvert",
    privilege_used: name ? `Privilège utilisé: ${name}` : "Privilège utilisé",
    login: "Connexion",
    signup: "Inscription",
  };
  return labels[row.event_type] ?? row.event_type;
}

export async function fetchAdminAnalytics(
  supabase: SupabaseClient,
): Promise<AdminAnalyticsSnapshot> {
  const today = startOfDay();
  const week = startOfWeek();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [eventsRes, profilesRes, bookingsRes, historyRes] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("id, user_id, event_type, metadata, created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("profiles")
      .select("id, full_name, email, total_unlocks, created_at"),
    supabase
      .from("bookings")
      .select("status, created_at, starts_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("history")
      .select("subject_id, event_type, created_at")
      .in("event_type", ["unlock_validated", "free_used"])
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  if (eventsRes.error) throw eventsRes.error;
  if (profilesRes.error) throw profilesRes.error;
  if (bookingsRes.error) throw bookingsRes.error;
  if (historyRes.error) throw historyRes.error;

  const events = (eventsRes.data ?? []) as AnalyticsEventRow[];
  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const bookings = (bookingsRes.data ?? []) as BookingRow[];
  const history = (historyRes.data ?? []) as HistoryRow[];

  const todayEvents = events.filter((row) => isSince(row.created_at, today));
  const weekEvents = events.filter((row) => isSince(row.created_at, week));
  const todayBookings = bookings.filter((row) => isSince(row.created_at, today));
  const todayUnlocks = history.filter(
    (row) => row.event_type === "unlock_validated" && isSince(row.created_at, today),
  );
  const weekUnlocks = history.filter(
    (row) => row.event_type === "unlock_validated" && isSince(row.created_at, week),
  );

  const acceptedCount = bookings.filter((row) => row.status === "accepted").length;
  const refusedCount = bookings.filter((row) => row.status === "refused").length;
  const decisionCount = acceptedCount + refusedCount;
  const totalUnlocks = profiles.reduce(
    (acc, profile) => acc + (profile.total_unlocks ?? 0),
    0,
  );
  const avgUnlocks = profiles.length ? totalUnlocks / profiles.length : 0;
  const avgProgress = profiles.length
    ? profiles.reduce((acc, p) => acc + ((p.total_unlocks ?? 0) % 5), 0) /
      profiles.length
    : 0;

  const privilegeOpened = events.filter(
    (row) => row.event_type === "privilege_opened" && row.metadata?.name !== "page",
  );
  const privilegeUsed = events.filter((row) => row.event_type === "privilege_used");
  const openedMap = countBy(privilegeOpened, (row) =>
    typeof row.metadata?.name === "string" ? row.metadata.name : null,
  );
  const usedMap = countBy(privilegeUsed, (row) =>
    typeof row.metadata?.name === "string" ? row.metadata.name : null,
  );

  const topClients = [...profiles]
    .sort((a, b) => (b.total_unlocks ?? 0) - (a.total_unlocks ?? 0))
    .slice(0, 5)
    .map((profile) => ({
      name: displayClient(profile),
      value: profile.total_unlocks ?? 0,
      detail: "déblocages",
    }));

  const slotMap = countBy(bookings, (row) =>
    new Date(row.starts_at).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
  const dayMap = countBy(bookings, (row) =>
    new Date(row.starts_at).toLocaleDateString("fr-FR", { weekday: "short" }),
  );

  return {
    users: {
      kpis: [
        {
          label: "Actifs aujourd'hui",
          value: distinctUsers(todayEvents),
          detail: "utilisateurs uniques",
          tone: "amber",
        },
        {
          label: "Actifs semaine",
          value: distinctUsers(weekEvents),
          detail: "depuis lundi",
          tone: "emerald",
        },
        {
          label: "Nouveaux inscrits",
          value: profiles.filter((row) => isSince(row.created_at, today)).length,
          detail: "aujourd'hui",
          tone: "violet",
        },
        {
          label: "Connexions",
          value: todayEvents.filter((row) => row.event_type === "login").length,
          detail: "aujourd'hui",
          tone: "rose",
        },
      ],
      activityLast7: buildLast7Activity(events),
    },
    reservations: {
      kpis: [
        {
          label: "Réservations",
          value: todayBookings.length,
          detail: "créées aujourd'hui",
          tone: "amber",
        },
        {
          label: "Acceptation",
          value: `${decisionCount ? Math.round((acceptedCount / decisionCount) * 100) : 0}%`,
          detail: "30 derniers jours",
          tone: "emerald",
        },
        {
          label: "Refus",
          value: `${decisionCount ? Math.round((refusedCount / decisionCount) * 100) : 0}%`,
          detail: "30 derniers jours",
          tone: "rose",
        },
        {
          label: "Créneaux suivis",
          value: bookings.length,
          detail: "30 derniers jours",
          tone: "violet",
        },
      ],
      popularSlots: chartFromMap(slotMap, 6),
      popularDays: chartFromMap(dayMap, 7),
      statusSplit: [
        { label: "Acceptées", value: acceptedCount },
        { label: "Refusées", value: refusedCount },
      ],
    },
    loyalty: {
      kpis: [
        {
          label: "Déblocages validés",
          value: todayUnlocks.length,
          detail: "aujourd'hui",
          tone: "amber",
        },
        {
          label: "Semaine",
          value: weekUnlocks.length,
          detail: "déblocages",
          tone: "emerald",
        },
        {
          label: "Moyenne client",
          value: avgUnlocks.toFixed(1),
          detail: "déblocages / client",
          tone: "violet",
        },
        {
          label: "Progression moyenne",
          value: `${Math.round((avgProgress / 5) * 100)}%`,
          detail: "vers prochain gratuit",
          tone: "rose",
        },
      ],
      topClients,
      progressAverage: avgProgress,
    },
    privileges: {
      kpis: [
        {
          label: "Ouvertures",
          value: privilegeOpened.length,
          detail: "30 derniers jours",
          tone: "amber",
        },
        {
          label: "Utilisations",
          value: privilegeUsed.length,
          detail: "30 derniers jours",
          tone: "emerald",
        },
        {
          label: "Jamais utilisés",
          value: knownPrivilegeNames.filter((name) => !usedMap.has(name)).length,
          detail: "privilèges à pousser",
          tone: "violet",
        },
        {
          label: "Conversion",
          value: `${
            privilegeOpened.length
              ? Math.round((privilegeUsed.length / privilegeOpened.length) * 100)
              : 0
          }%`,
          detail: "utilisation / ouverture",
          tone: "rose",
        },
      ],
      opened: topFromMap(openedMap, 5),
      used: topFromMap(usedMap, 5),
      neverUsed: knownPrivilegeNames.filter((name) => !usedMap.has(name)),
    },
    realtime: events.slice(0, 8).map((row) => ({
      id: row.id,
      event_type: row.event_type,
      created_at: row.created_at,
      label: eventLabel(row),
    })),
  };
}

