import { formatEur, type AccountingLedgerEntry } from "@/lib/admin/accounting";

const actionLabelFr: Record<string, string> = {
  paid_unlock: "Déblocage payant",
  unlock_cancellation: "Annulation déblocage",
};

function formatActionType(actionType: string): string {
  return actionLabelFr[actionType] ?? actionType.replaceAll("_", " ");
}

type AccountingLedgerProps = {
  entries: AccountingLedgerEntry[];
};

export function AccountingLedger({ entries }: AccountingLedgerProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">
        Historique comptable
      </h2>
      {entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
          Aucune écriture pour l&apos;instant.
        </p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card/30">
          {entries.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-2 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-200 tabular-nums">
                    {formatEur(row.amount_eur)}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {row.client_name}
                  </p>
                </div>
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
              <p className="text-xs text-muted-foreground">
                {formatActionType(row.action_type)} · par {row.actor_name}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
