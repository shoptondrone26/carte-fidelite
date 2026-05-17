import { formatHistoryEventType } from "@/lib/history/labels";
import type { CycleProgress } from "@/lib/loyalty/vip";

type FreeUsedRow = {
  id: string;
  created_at: string;
};

type FreeRewardsPanelProps = {
  freeAvailable: number;
  freeEarned: number;
  freeUsed: number;
  freeUsedHistory: FreeUsedRow[];
  cycle: CycleProgress;
};

export function FreeRewardsPanel({
  freeAvailable,
  freeEarned,
  freeUsed,
  freeUsedHistory,
  cycle,
}: FreeRewardsPanelProps) {
  const visitsBeforeNext = Math.max(cycle.max - cycle.current, 0);
  const motivation =
    freeAvailable > 0
      ? "Votre prochain avantage est déjà disponible."
      : visitsBeforeNext === 1
        ? "1 visite avant votre prochain avantage."
        : `${visitsBeforeNext} visites avant votre prochain avantage.`;
  const nextTier =
    freeAvailable > 0
      ? "Accès gratuit à utiliser"
      : cycle.current === 0
        ? "Prochain privilège en préparation"
        : "Prochain palier en approche";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-300/15 bg-linear-to-br from-card/60 via-card/35 to-amber-950/20 p-5 shadow-xl shadow-black/25">
      <div
        aria-hidden
        className="premium-ambient pointer-events-none absolute -right-14 top-6 size-36 rounded-full bg-amber-300/10 blur-3xl"
      />
      <div className="relative space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-200/70">
            Récompenses privées
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            Vos gratuits
          </h3>
          <p className="mt-1 text-sm font-medium text-amber-100">
            {motivation}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Un gratuit est consommé lorsque l&apos;établissement confirme son
            utilisation.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-300">Progression avantage</span>
            <span className="tabular-nums text-amber-100">{cycle.label}</span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="premium-shimmer h-full rounded-full bg-linear-to-r from-amber-600 via-amber-200 to-amber-500"
              style={{ width: `${cycle.percent}%` }}
            />
          </div>
          <p className="mt-3 rounded-xl border border-amber-300/15 bg-amber-400/10 px-3 py-2 text-xs text-amber-50">
            {nextTier}
          </p>
        </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-border/50 bg-muted/20 px-2 py-3">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Gagnés
          </dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">
            {freeEarned}
          </dd>
        </div>
        <div className="rounded-xl border border-border/50 bg-muted/20 px-2 py-3">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Utilisés
          </dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">
            {freeUsed}
          </dd>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-2 py-3">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-amber-200/80">
            Disponibles
          </dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-amber-100">
            {freeAvailable}
          </dd>
        </div>
      </dl>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Historique des gratuits utilisés
        </h4>
        {freeUsedHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun gratuit marqué comme utilisé pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-border/50 rounded-xl border border-border/50">
            {freeUsedHistory.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm"
              >
                <span className="font-medium text-foreground">
                  {formatHistoryEventType("free_used")}
                </span>
                <time
                  className="shrink-0 text-xs tabular-nums text-muted-foreground"
                  dateTime={row.created_at}
                >
                  {new Date(row.created_at).toLocaleString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>
    </section>
  );
}
