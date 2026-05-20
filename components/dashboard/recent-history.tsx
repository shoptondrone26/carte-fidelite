import { Check, Gift, Sparkles, X } from "lucide-react";

import { formatHistoryEventType } from "@/lib/history/labels";
import { cn } from "@/lib/utils";

type HistoryRow = {
  id: string;
  event_type: string;
  created_at: string;
};

type RecentHistoryProps = {
  items: HistoryRow[];
  /** Limite d’éléments affichés (ex. 5 sur la page Carte). */
  maxItems?: number;
  compact?: boolean;
};

function eventPresentation(eventType: string) {
  switch (eventType) {
    case "booking_accepted":
      return {
        icon: Check,
        title: "Réservation acceptée",
        detail: "Accès confirmé",
        tone: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
      };
    case "booking_refused":
      return {
        icon: X,
        title: "Réservation refusée",
        detail: "Nouveau créneau possible",
        tone: "border-rose-300/25 bg-rose-400/10 text-rose-100",
      };
    case "booking_cancelled":
      return {
        icon: X,
        title: "Réservation annulée",
        detail: "Créneau libéré",
        tone: "border-zinc-300/20 bg-zinc-400/10 text-zinc-200",
      };
    case "free_used":
    case "unlock_validated":
      return {
        icon: Gift,
        title:
          eventType === "free_used" ? "Gratuit utilisé" : "Déblocage validé",
        detail: "Progression mise à jour",
        tone: "border-amber-300/25 bg-amber-400/10 text-amber-100",
      };
    default:
      return {
        icon: Sparkles,
        title: formatHistoryEventType(eventType),
        detail: "Activité membre",
        tone: "border-white/10 bg-white/4 text-zinc-200",
      };
  }
}

export function RecentHistory({
  items,
  maxItems,
  compact = false,
}: RecentHistoryProps) {
  const visible = maxItems != null ? items.slice(0, maxItems) : items;

  if (visible.length === 0) {
    return (
      <section
        className={cn(
          "rounded-2xl border border-dashed border-amber-300/15 bg-amber-500/5 text-center text-muted-foreground",
          compact ? "px-3 py-5 text-xs" : "rounded-3xl px-4 py-8 text-sm",
        )}
      >
        Votre historique apparaîtra après vos premières réservations.
      </section>
    );
  }

  return (
    <section className={cn(compact ? "space-y-2.5" : "space-y-4")}>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/60">
          Historique
        </p>
        <h3
          className={cn(
            "font-semibold tracking-tight text-foreground",
            compact ? "mt-0.5 text-sm" : "mt-1 text-lg",
          )}
        >
          Activité récente
        </h3>
      </div>
      <ul className={cn("relative", compact ? "space-y-2" : "space-y-3")}>
        {!compact ? (
          <span
            aria-hidden
            className="absolute bottom-3 left-[1.2rem] top-3 w-px bg-linear-to-b from-amber-200/35 via-white/8 to-transparent"
          />
        ) : null}
        {visible.map((row) => {
          const event = eventPresentation(row.event_type);
          const Icon = event.icon;

          return (
            <li
              key={row.id}
              className={cn(
                "relative grid grid-cols-[auto_1fr] gap-2.5 rounded-xl border border-white/8 bg-card/30 text-sm shadow-sm shadow-black/10 transition active:scale-[0.995]",
                compact ? "p-2" : "grid-cols-[2.75rem_1fr] gap-3 rounded-2xl p-3 shadow-lg",
              )}
            >
              <span
                className={cn(
                  "relative z-10 flex shrink-0 items-center justify-center rounded-xl border",
                  compact ? "size-9" : "size-11 rounded-2xl",
                  event.tone,
                )}
              >
                <Icon
                  className={cn(compact ? "size-4" : "size-5")}
                  aria-hidden
                />
              </span>
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "font-medium text-foreground",
                        compact && "text-[13px] leading-tight",
                      )}
                    >
                      {event.title}
                    </p>
                    <p
                      className={cn(
                        "text-muted-foreground",
                        compact
                          ? "mt-0.5 text-[10px] leading-snug"
                          : "mt-0.5 text-xs",
                      )}
                    >
                      {event.detail}
                    </p>
                  </div>
                  <time
                    className={cn(
                      "shrink-0 text-right tabular-nums text-muted-foreground",
                      compact ? "text-[10px]" : "text-[11px]",
                    )}
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
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
