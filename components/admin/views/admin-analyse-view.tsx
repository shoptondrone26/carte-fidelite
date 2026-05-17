import {
  Activity,
  CalendarClock,
  Crown,
  Gem,
  Sparkles,
  Users,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import type {
  AdminAnalyticsSnapshot,
  AnalyticsChartPoint,
  AnalyticsKpi,
  AnalyticsNamedMetric,
} from "@/lib/admin/analytics";
import { cn } from "@/lib/utils";

type AdminAnalyseViewProps = {
  data: AdminAnalyticsSnapshot;
};

const toneClasses: Record<AnalyticsKpi["tone"], string> = {
  amber: "border-amber-200/20 bg-amber-300/10 text-amber-100 shadow-amber-950/20",
  emerald:
    "border-emerald-200/20 bg-emerald-300/10 text-emerald-100 shadow-emerald-950/20",
  violet:
    "border-violet-200/20 bg-violet-300/10 text-violet-100 shadow-violet-950/20",
  rose: "border-rose-200/20 bg-rose-300/10 text-rose-100 shadow-rose-950/20",
};

function maxValue(points: { value: number; secondary?: number }[]): number {
  return Math.max(
    1,
    ...points.flatMap((point) => [point.value, point.secondary ?? 0]),
  );
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  const minutes = Math.max(0, Math.round(diff / 60_000));
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function KpiGrid({ items }: { items: AnalyticsKpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <article
          key={item.label}
          className={cn(
            "relative overflow-hidden rounded-[1.35rem] border p-4 shadow-xl backdrop-blur-xl",
            toneClasses[item.tone],
          )}
        >
          <div
            aria-hidden
            className="absolute -right-8 -top-8 size-20 rounded-full bg-white/10 blur-2xl"
          />
          <p className="relative text-[10px] font-semibold uppercase tracking-[0.22em] text-current/70">
            {item.label}
          </p>
          <p className="relative mt-2 text-2xl font-semibold tracking-tight text-white">
            {item.value}
          </p>
          <p className="relative mt-1 text-xs text-current/65">{item.detail}</p>
        </article>
      ))}
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/10 text-amber-100 shadow-[0_0_30px_rgba(251,191,36,0.12)]">
          <Icon className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            {subtitle}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function LineChart({ points }: { points: AnalyticsChartPoint[] }) {
  const max = maxValue(points);
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Activité 7 jours</p>
        <span className="text-[10px] uppercase tracking-[0.22em] text-amber-100/70">
          realtime
        </span>
      </div>
      <div className="flex h-36 items-end gap-2">
        {points.map((point) => (
          <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-28 w-full items-end justify-center gap-1">
              <span
                className="w-3 rounded-full bg-linear-to-t from-amber-700 via-amber-300 to-white shadow-[0_0_18px_rgba(251,191,36,0.28)] transition-all duration-700"
                style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }}
                title={`${point.value} événements`}
              />
              <span
                className="w-2 rounded-full bg-white/25 transition-all duration-700"
                style={{
                  height: `${Math.max(6, ((point.secondary ?? 0) / max) * 100)}%`,
                }}
                title={`${point.secondary ?? 0} actifs`}
              />
            </div>
            <span className="truncate text-[10px] text-zinc-500">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bars({
  title,
  points,
  empty = "Pas encore de données.",
}: {
  title: string;
  points: AnalyticsChartPoint[];
  empty?: string;
}) {
  const max = maxValue(points);
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-3">
        {points.length === 0 ? (
          <p className="text-sm text-zinc-500">{empty}</p>
        ) : (
          points.map((point) => (
            <div key={point.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-zinc-300">{point.label}</span>
                <span className="tabular-nums text-amber-100">{point.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/7">
                <div
                  className="h-full rounded-full bg-linear-to-r from-amber-800 via-amber-300 to-white shadow-[0_0_18px_rgba(251,191,36,0.25)] transition-all duration-700"
                  style={{ width: `${Math.max(4, (point.value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Ranking({
  title,
  items,
  empty = "Aucune donnée pour le moment.",
}: {
  title: string;
  items: AnalyticsNamedMetric[];
  empty?: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ol className="mt-4 space-y-3">
        {items.length === 0 ? (
          <li className="text-sm text-zinc-500">{empty}</li>
        ) : (
          items.map((item, index) => (
            <li key={item.name} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-zinc-300">
                  {index + 1}. {item.name}
                </span>
                <span className="shrink-0 tabular-nums text-amber-100">
                  {item.value} {item.detail ?? ""}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/7">
                <div
                  className="h-full rounded-full bg-amber-200/80 transition-all duration-700"
                  style={{ width: `${Math.max(5, (item.value / max) * 100)}%` }}
                />
              </div>
            </li>
          ))
        )}
      </ol>
    </div>
  );
}

function RealtimeFeed({ data }: { data: AdminAnalyticsSnapshot["realtime"] }) {
  return (
    <div className="rounded-[1.75rem] border border-amber-200/15 bg-linear-to-br from-amber-300/10 via-white/[0.035] to-black p-4 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">Activité temps réel</h3>
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-emerald-100/80">
          <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.8)]" />
          live
        </span>
      </div>
      <ul className="space-y-2">
        {data.length === 0 ? (
          <li className="text-sm text-zinc-500">Aucune activité récente.</li>
        ) : (
          data.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/25 px-3 py-2.5"
            >
              <span className="min-w-0 truncate text-sm text-zinc-200">
                {event.label}
              </span>
              <span className="shrink-0 text-[11px] text-zinc-500">
                {formatTimeAgo(event.created_at)}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function AdminAnalyseView({ data }: AdminAnalyseViewProps) {
  return (
    <div className="relative flex flex-col gap-8 overflow-hidden pb-6">
      <div
        aria-hidden
        className="premium-ambient pointer-events-none absolute inset-x-8 top-0 h-56 rounded-full bg-amber-300/12 blur-3xl"
      />

      <section className="relative overflow-hidden rounded-[2rem] border border-amber-200/20 bg-linear-to-br from-zinc-950 via-black to-amber-950/25 p-5 shadow-2xl shadow-black/40">
        <div
          aria-hidden
          className="premium-sheen pointer-events-none absolute inset-y-[-30%] left-0 w-1/2 bg-linear-to-r from-transparent via-white/10 to-transparent blur-sm"
        />
        <div className="relative space-y-3">
          <p className="premium-shimmer w-fit bg-linear-to-r from-amber-100 via-white to-amber-300 bg-clip-text text-[10px] font-semibold uppercase tracking-[0.35em] text-transparent">
            Intelligence business
          </p>
          <h1 className="text-3xl font-semibold tracking-tighter text-white">
            Analyse premium
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
            Usage réel, rétention, réservations, fidélité et privilèges dans un
            espace pensé pour piloter le club privé.
          </p>
        </div>
      </section>

      <RealtimeFeed data={data.realtime} />

      <Section
        title="Utilisateurs"
        subtitle="Activité réelle, inscriptions et connexions."
        icon={Users}
      >
        <KpiGrid items={data.users.kpis} />
        <LineChart points={data.users.activityLast7} />
      </Section>

      <Section
        title="Réservations"
        subtitle="Volume, créneaux populaires et décisions admin."
        icon={CalendarClock}
      >
        <KpiGrid items={data.reservations.kpis} />
        <div className="grid gap-3">
          <Bars title="Créneaux populaires" points={data.reservations.popularSlots} />
          <Bars title="Jours populaires" points={data.reservations.popularDays} />
          <Bars title="Acceptation / refus" points={data.reservations.statusSplit} />
        </div>
      </Section>

      <Section
        title="Fidélité"
        subtitle="Déblocages, progression moyenne et meilleurs membres."
        icon={Crown}
      >
        <KpiGrid items={data.loyalty.kpis} />
        <Ranking title="Top clients fidélité" items={data.loyalty.topClients} />
      </Section>

      <Section
        title="Privilèges"
        subtitle="Ce qui attire, ce qui est utilisé, ce qui dort."
        icon={Gem}
      >
        <KpiGrid items={data.privileges.kpis} />
        <div className="grid gap-3">
          <Ranking title="Privilèges les plus ouverts" items={data.privileges.opened} />
          <Ranking title="Privilèges utilisés" items={data.privileges.used} />
          <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-amber-200" aria-hidden />
              <h3 className="text-sm font-semibold text-white">Jamais utilisés</h3>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.privileges.neverUsed.length === 0 ? (
                <span className="text-sm text-zinc-500">
                  Tous les privilèges ont déjà été utilisés.
                </span>
              ) : (
                data.privileges.neverUsed.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-amber-200/15 bg-amber-200/8 px-3 py-1 text-xs text-amber-100"
                  >
                    {name}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </Section>

      <div className="flex items-center gap-2 rounded-[1.5rem] border border-white/10 bg-white/[0.035] px-4 py-3 text-xs leading-relaxed text-zinc-500">
        <Activity className="size-4 shrink-0 text-amber-200/70" aria-hidden />
        <span>
          Tracking léger : événements utiles seulement, insertion sécurisée par RPC,
          lecture admin-only.
        </span>
      </div>
    </div>
  );
}

