import { formatHistoryEventType } from "@/lib/history/labels";

type HistoryRow = {
  id: string;
  event_type: string;
  created_at: string;
};

type RecentHistoryProps = {
  items: HistoryRow[];
};

export function RecentHistory({ items }: RecentHistoryProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        Aucun événement récent. Vos déblocages et avantages apparaîtront ici.
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        Historique récent
      </h3>
      <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card/30">
        {items.map((row) => (
          <li
            key={row.id}
            className="flex flex-col gap-1 px-4 py-3 text-sm first:rounded-t-2xl last:rounded-b-2xl"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground">
                {formatHistoryEventType(row.event_type)}
              </span>
              <time
                className="shrink-0 text-xs tabular-nums text-muted-foreground"
                dateTime={row.created_at}
              >
                {new Date(row.created_at).toLocaleString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
