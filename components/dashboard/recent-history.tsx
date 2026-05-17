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
};

function eventPresentation(eventType: string) {
  switch (eventType) {
    case "booking_accepted":
      return {
        icon: Check,
        title: "Réservation acceptée",
        detail: "Accès membre confirmé",
        tone: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
      };
    case "booking_refused":
      return {
        icon: X,
        title: "Réservation refusée",
        detail: "Choisissez un autre créneau",
        tone: "border-rose-300/25 bg-rose-400/10 text-rose-100",
      };
    case "booking_cancelled":
      return {
        icon: X,
        title: "Réservation annulée",
        detail: "Créneau libéré dans votre activité membre",
        tone: "border-zinc-300/20 bg-zinc-400/10 text-zinc-200",
      };
    case "free_used":
    case "unlock_validated":
      return {
        icon: Gift,
        title:
          eventType === "free_used" ? "Gratuit utilisé" : "Déblocage validé",
        detail: "Progression membre mise à jour",
        tone: "border-amber-300/25 bg-amber-400/10 text-amber-100",
      };
    default:
      return {
        icon: Sparkles,
        title: formatHistoryEventType(eventType),
        detail: "Activité de votre espace privé",
        tone: "border-white/10 bg-white/4 text-zinc-200",
      };
  }
}

export function RecentHistory({ items }: RecentHistoryProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-amber-300/20 bg-amber-500/5 px-4 py-8 text-center text-sm text-muted-foreground">
        Votre timeline privée apparaîtra ici après vos premières réservations et
        récompenses.
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-200/70">
          Timeline privée
        </p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
          Historique récent
        </h3>
      </div>
      <ul className="relative space-y-3">
        <span
          aria-hidden
          className="absolute bottom-4 left-[1.35rem] top-4 w-px bg-linear-to-b from-amber-200/40 via-white/10 to-transparent"
        />
        {items.map((row) => {
          const event = eventPresentation(row.event_type);
          const Icon = event.icon;

          return (
            <li
              key={row.id}
              className="relative grid grid-cols-[2.75rem_1fr] gap-3 rounded-2xl border border-white/10 bg-card/35 p-3 text-sm shadow-lg shadow-black/10 transition duration-500 active:scale-[0.995]"
            >
              <span
                className={cn(
                  "relative z-10 flex size-11 items-center justify-center rounded-2xl border",
                  event.tone,
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{event.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {event.detail}
                    </p>
                  </div>
                  <time
                    className="shrink-0 text-right text-[11px] tabular-nums text-muted-foreground"
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
                <span className="mt-2 block h-px bg-linear-to-r from-transparent via-amber-100/15 to-transparent" />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
