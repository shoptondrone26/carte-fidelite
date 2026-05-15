import { formatEur, type TopClientByRevenue } from "@/lib/admin/accounting";

type AccountingTopClientsProps = {
  clients: TopClientByRevenue[];
};

export function AccountingTopClients({ clients }: AccountingTopClientsProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">Top clients (CA)</h2>
      {clients.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
          Aucune transaction enregistrée.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {clients.map((c, i) => (
            <li
              key={c.profile_id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/30 px-3 py-3"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-100">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {c.full_name?.trim() || c.email || "Client"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {c.paid_unlocks_count} déblocage
                    {c.paid_unlocks_count > 1 ? "s" : ""}
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-amber-200">
                {formatEur(c.total_spent_eur)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
