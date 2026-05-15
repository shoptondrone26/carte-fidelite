"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { markFreeUsedAction } from "@/actions/admin-free";
import { validateUnlockAction } from "@/actions/admin-unlock";
import { ValidateUnlockAmountDialog } from "@/components/admin/validate-unlock-amount-dialog";
import { buttonVariants } from "@/components/ui/button";
import { formatEur, type UnlockAmountEur } from "@/lib/admin/accounting";
import { formatHistoryEventType } from "@/lib/history/labels";
import {
  getFreeAvailable,
  getFreeEarned,
} from "@/lib/loyalty/free-rewards";
import {
  getCycleProgress,
  getVipLevel,
  vipLevelLabelFr,
} from "@/lib/loyalty/vip";
import { cn } from "@/lib/utils";

export type AdminHistorySnippet = {
  id: string;
  event_type: string;
  created_at: string;
};

export type AdminClientCardData = {
  id: string;
  full_name: string | null;
  email: string | null;
  snap: string | null;
  total_unlocks: number | null;
  free_used_count: number;
  /** Données comptables — admin uniquement */
  total_spent_eur: number;
  paid_unlocks_count: number;
};

type AdminClientCardProps = {
  client: AdminClientCardData;
  history: AdminHistorySnippet[];
};

export function AdminClientCard({ client, history }: AdminClientCardProps) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [amountOpen, setAmountOpen] = useState(false);
  const total = client.total_unlocks ?? 0;
  const vip = getVipLevel(total);
  const cycle = getCycleProgress(total);
  const freeEarned = getFreeEarned(total);
  const freeUsed = client.free_used_count;
  const freeAvailable = getFreeAvailable(freeEarned, freeUsed);
  const displayName =
    client.full_name?.trim() || client.email?.trim() || "Client";

  function onConfirmAmount(amount: UnlockAmountEur) {
    start(async () => {
      const res = await validateUnlockAction(client.id, amount);
      if (res.ok) {
        setAmountOpen(false);
        toast.success("Déblocage validé", {
          description: `${displayName} : +1 tampon · ${formatEur(amount)} enregistré.`,
        });
        router.refresh();
      } else {
        toast.error(res.error ?? "Erreur");
      }
    });
  }

  function onMarkFreeUsed() {
    start(async () => {
      const res = await markFreeUsedAction(client.id);
      if (res.ok) {
        toast.success("Gratuit utilisé", {
          description: `${displayName} : gratuit marqué comme consommé.`,
        });
        router.refresh();
      } else {
        toast.error(res.error ?? "Erreur");
      }
    });
  }

  return (
    <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-zinc-800/90 via-zinc-900 to-zinc-950 p-5 shadow-xl shadow-black/40">
      <CardGlow />
      <div className="relative flex flex-col gap-4">
        <header className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-400">
              Client
            </p>
            <h3 className="mt-0.5 text-lg font-semibold tracking-tight text-white">
              {displayName}
            </h3>
            {client.snap ? (
              <p className="mt-1 text-sm text-amber-200/90">
                Snap :{" "}
                <span className="font-medium text-amber-100">{client.snap}</span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-zinc-500">Snap non renseigné</p>
            )}
          </div>
          <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-100">
            VIP {vipLevelLabelFr[vip]}
          </span>
        </header>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Déblocages" value={String(total)} />
          <Stat label="Cycle" value={cycle.label} />
        </dl>

        <dl className="grid grid-cols-3 gap-2 text-sm">
          <Stat label="Gagnés" value={String(freeEarned)} accent="amber" />
          <Stat label="Utilisés" value={String(freeUsed)} />
          <Stat
            label="Disponibles"
            value={String(freeAvailable)}
            accent={freeAvailable > 0 ? "emerald" : undefined}
          />
        </dl>

        <div className="space-y-2 rounded-2xl border border-violet-500/20 bg-violet-500/5 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-violet-300/90">
            Interne admin
          </p>
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <Stat
              label="Total dépensé"
              value={formatEur(client.total_spent_eur)}
              accent="amber"
            />
            <Stat
              label="Débloc. payés"
              value={String(client.paid_unlocks_count)}
            />
            <Stat label="Gratuits" value={String(freeUsed)} accent="emerald" />
          </dl>
        </div>

        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-black/40 ring-1 ring-inset ring-white/10">
            <div
              className="h-full rounded-full bg-linear-to-r from-amber-500 via-amber-300 to-amber-400 transition-all duration-500"
              style={{
                width: `${cycle.justCompletedFree ? 100 : cycle.percent}%`,
              }}
            />
          </div>
          {cycle.justCompletedFree && freeAvailable > 0 ? (
            <p className="text-xs text-emerald-300/90">
              Cycle complété — {freeAvailable} gratuit
              {freeAvailable > 1 ? "s" : ""} à utiliser.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setAmountOpen(true)}
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "h-12 w-full justify-center bg-amber-500 text-zinc-950 hover:bg-amber-400",
            )}
          >
            Déblocage validé
          </button>
          {freeAvailable > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={onMarkFreeUsed}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 w-full justify-center border-emerald-500/40 text-emerald-100 hover:bg-emerald-500/10",
              )}
            >
              Gratuit utilisé
            </button>
          ) : null}
        </div>

        {history.length > 0 ? (
          <div className="space-y-2 border-t border-white/10 pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Historique récent
            </p>
            <ul className="flex flex-col gap-1.5">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between gap-2 text-xs text-zinc-400"
                >
                  <span className="truncate text-zinc-300">
                    {formatHistoryEventType(h.event_type)}
                  </span>
                  <time className="shrink-0 tabular-nums">
                    {new Date(h.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </time>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <ValidateUnlockAmountDialog
        open={amountOpen}
        onOpenChange={setAmountOpen}
        clientName={displayName}
        busy={busy}
        onConfirm={onConfirmAmount}
      />
    </article>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber" | "emerald";
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 text-lg font-semibold tabular-nums",
          accent === "amber"
            ? "text-amber-200"
            : accent === "emerald"
              ? "text-emerald-300"
              : "text-white",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function CardGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-amber-400/10 blur-2xl"
    />
  );
}
