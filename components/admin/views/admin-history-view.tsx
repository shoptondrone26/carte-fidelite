import { formatHistoryEventType } from "@/lib/history/labels";
import type { AdminHistoryEntry } from "@/lib/admin/data";

type AdminHistoryViewProps = {
  entries: AdminHistoryEntry[];
};

export function AdminHistoryView({ entries }: AdminHistoryViewProps) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <p className="text-sm text-muted-foreground">
        Journal complet des événements fidélité et réservations.
      </p>
      {entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
          Aucun événement.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card/30">
          {entries.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-1 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {formatHistoryEventType(row.event_type)}
                </span>
                <time className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {new Date(row.created_at).toLocaleString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              <p className="text-xs text-muted-foreground">
                {row.profiles?.full_name?.trim() ||
                  row.profiles?.email ||
                  "Client"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
