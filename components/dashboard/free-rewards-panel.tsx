import { formatHistoryEventType } from "@/lib/history/labels";

type FreeUsedRow = {
  id: string;
  created_at: string;
};

type FreeRewardsPanelProps = {
  freeAvailable: number;
  freeEarned: number;
  freeUsed: number;
  freeUsedHistory: FreeUsedRow[];
};

export function FreeRewardsPanel({
  freeAvailable,
  freeEarned,
  freeUsed,
  freeUsedHistory,
}: FreeRewardsPanelProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card/30 p-5">
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Vos gratuits
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Un gratuit est consommé lorsque l&apos;établissement confirme son
          utilisation.
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
    </section>
  );
}
