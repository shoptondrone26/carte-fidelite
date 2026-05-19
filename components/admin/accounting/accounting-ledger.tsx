import { formatEur, type AccountingLedgerEntry } from "@/lib/admin/accounting";
import { cn } from "@/lib/utils";

const actionLabelFr: Record<string, string> = {
  paid_unlock: "Déblocage payant",
  unlock_cancellation: "Annulation déblocage",
  phantom_mode: "Mode Fantôme",
  phantom_mode_cancellation: "Annulation Mode Fantôme",
  shop_order: "Boutique",
  shop_order_cancellation: "Annulation boutique",
};

function formatActionType(actionType: string): string {
  return actionLabelFr[actionType] ?? actionType.replaceAll("_", " ");
}

function isShopEntry(actionType: string): boolean {
  return actionType === "shop_order" || actionType === "shop_order_cancellation";
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
          {entries.map((row) => {
            const shop = isShopEntry(row.action_type);
            const products =
              row.products_label ?? row.product_name ?? null;

            return (
              <li
                key={row.id}
                className="flex flex-col gap-2 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-amber-200 tabular-nums">
                        {formatEur(row.amount_eur)}
                      </p>
                      {shop && row.order_status_label ? (
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            row.order_status_label === "Terminée"
                              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                              : "border-rose-400/30 bg-rose-400/10 text-rose-100",
                          )}
                        >
                          {row.order_status_label}
                        </span>
                      ) : null}
                    </div>
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
                  <span className="font-medium text-zinc-300">
                    {formatActionType(row.action_type)}
                  </span>
                  {products ? (
                    <>
                      {" "}
                      ·{" "}
                      <span className="text-zinc-400">{products}</span>
                    </>
                  ) : null}
                  {" "}
                  · par {row.actor_name}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
