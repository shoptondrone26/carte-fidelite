"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { markFreeUsedAction } from "@/actions/admin-free";
import {
  undoLastUnlockAction,
  validateUnlockAction,
} from "@/actions/admin-unlock";
import { adminCancelLatestShopOrderAction } from "@/actions/shop-orders";
import { cancelPhantomRequestAction } from "@/actions/phantom";
import { ValidateUnlockAmountDialog } from "@/components/admin/validate-unlock-amount-dialog";
import { buttonVariants } from "@/components/ui/button";
import { formatEur, type UnlockAmountEur } from "@/lib/admin/accounting";
import { formatHistoryEventType } from "@/lib/history/labels";
import { formatShopPrice } from "@/lib/boutique/products";
import {
  shopOrderStatusLabelFr,
  type ClientLatestShopOrderSnippet,
} from "@/lib/boutique/orders";
import {
  PHANTOM_AMOUNT_EUR,
  phantomStatusLabelFr,
  type PhantomRequestStatus,
} from "@/lib/phantom/requests";
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
  phantom_request: {
    id: string;
    status: PhantomRequestStatus;
    amount_eur: number;
    created_at: string;
  } | null;
  latest_shop_order: ClientLatestShopOrderSnippet | null;
};

type AdminClientCardProps = {
  client: AdminClientCardData;
  history: AdminHistorySnippet[];
};

export function AdminClientCard({ client, history }: AdminClientCardProps) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [amountOpen, setAmountOpen] = useState(false);
  const [undoOpen, setUndoOpen] = useState(false);
  const [cancelPhantomOpen, setCancelPhantomOpen] = useState(false);
  const [cancelShopOpen, setCancelShopOpen] = useState(false);
  const total = client.total_unlocks ?? 0;
  const vip = getVipLevel(total);
  const cycle = getCycleProgress(total);
  const freeEarned = getFreeEarned(total);
  const freeUsed = client.free_used_count;
  const freeAvailable = getFreeAvailable(freeEarned, freeUsed);
  const displayName =
    client.full_name?.trim() || client.email?.trim() || "Client";
  const cancellablePhantom = client.phantom_request;
  const cancellableShopOrder = client.latest_shop_order;

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

  function onConfirmUndo() {
    start(async () => {
      const res = await undoLastUnlockAction(client.id);
      if (res.ok) {
        setUndoOpen(false);
        toast.success("Dernier déblocage annulé", {
          description: `${displayName} : -1 tampon · ${formatEur(res.amountEur)} corrigé.`,
        });
        router.refresh();
      } else {
        toast.error(res.error ?? "Erreur");
      }
    });
  }

  function onConfirmCancelLatestShopOrder() {
    if (!cancellableShopOrder) return;
    start(async () => {
      const res = await adminCancelLatestShopOrderAction(client.id);
      if (res.ok) {
        setCancelShopOpen(false);
        toast.success("Commande boutique annulée", {
          description: `${displayName} : ${cancellableShopOrder.product_name}${
            cancellableShopOrder.status === "completed"
              ? " · contre-écriture comptable ajoutée"
              : " · stock et compta mis à jour si nécessaire"
          }.`,
        });
        router.refresh();
      } else {
        toast.error(res.error ?? "Erreur");
      }
    });
  }

  function onConfirmCancelPhantom() {
    if (!cancellablePhantom) return;
    start(async () => {
      const res = await cancelPhantomRequestAction(cancellablePhantom.id);
      if (res.ok) {
        setCancelPhantomOpen(false);
        toast.success("Mode Fantôme annulé", {
          description: `${displayName} : audit conservé${
            cancellablePhantom.status === "completed"
              ? " · contre-écriture comptable ajoutée si nécessaire"
              : ""
          }.`,
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
          <button
            type="button"
            disabled={busy || total <= 0}
            onClick={() => setUndoOpen(true)}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 w-full justify-center border-rose-500/35 text-rose-100 hover:bg-rose-500/10 disabled:opacity-45",
            )}
          >
            Annuler le dernier déblocage
          </button>
          {cancellablePhantom ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setCancelPhantomOpen(true)}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 w-full justify-center border-amber-500/40 text-amber-100 hover:bg-amber-500/10 disabled:opacity-45",
              )}
            >
              Annuler Mode Fantôme
            </button>
          ) : null}
          {cancellableShopOrder ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setCancelShopOpen(true)}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 w-full justify-center border-sky-500/40 text-sky-100 hover:bg-sky-500/10 disabled:opacity-45",
              )}
            >
              Annuler la dernière commande
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
      <UndoLastUnlockDialog
        open={undoOpen}
        onOpenChange={setUndoOpen}
        clientName={displayName}
        busy={busy}
        onConfirm={onConfirmUndo}
      />
      <CancelPhantomDialog
        open={cancelPhantomOpen}
        onOpenChange={setCancelPhantomOpen}
        clientName={displayName}
        request={cancellablePhantom}
        busy={busy}
        onConfirm={onConfirmCancelPhantom}
      />
      <CancelLatestShopOrderDialog
        open={cancelShopOpen}
        onOpenChange={setCancelShopOpen}
        clientName={displayName}
        order={cancellableShopOrder}
        busy={busy}
        onConfirm={onConfirmCancelLatestShopOrder}
      />
    </article>
  );
}

function CancelLatestShopOrderDialog({
  open,
  onOpenChange,
  clientName,
  order,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  order: ClientLatestShopOrderSnippet | null;
  busy: boolean;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !order) return null;

  const restoresStock =
    order.stock_reserved && order.status !== "completed";
  const wasCompleted = order.status === "completed";

  return (
    <div
      className="fixed inset-0 z-200 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-shop-order-title"
        onClick={() => !busy && onOpenChange(false)}
      >
        <div
          className="mx-auto w-full max-w-lg rounded-t-[1.75rem] border border-white/10 bg-zinc-950/95 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

          <div className="space-y-4">
            <div>
              <p
                id="cancel-shop-order-title"
                className="text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-200/90"
              >
                Annulation commande boutique
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                Annuler la dernière commande ?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Cette action concerne{" "}
                <span className="font-medium text-white">{clientName}</span>.
                La commande reste en base ; seul le statut passe à annulée.
              </p>
            </div>

            <ul className="space-y-2 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-3 text-sm text-sky-50/90">
              <li>Produit : {order.product_name}</li>
              <li>Montant : {formatShopPrice(order.total_price_eur)}</li>
              <li>Statut actuel : {shopOrderStatusLabelFr[order.status]}</li>
              <li>Trace historique : commande boutique annulée</li>
              {restoresStock ? (
                <li>Le stock réservé sera libéré.</li>
              ) : (
                <li>Le stock ne sera pas modifié (déjà déduit à la commande).</li>
              )}
              {wasCompleted ? (
                <li>
                  Une contre-écriture comptable sera ajoutée pour corriger le CA
                  boutique.
                </li>
              ) : null}
            </ul>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => onOpenChange(false)}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 justify-center",
                )}
              >
                Fermer
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onConfirm}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-12 justify-center bg-sky-600 text-white hover:bg-sky-500",
                )}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}

function CancelPhantomDialog({
  open,
  onOpenChange,
  clientName,
  request,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  request: AdminClientCardData["phantom_request"];
  busy: boolean;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !request) return null;

  return (
    <div
      className="fixed inset-0 z-200 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-phantom-title"
      onClick={() => !busy && onOpenChange(false)}
    >
      <div
        className="mx-auto w-full max-w-lg rounded-t-[1.75rem] border border-white/10 bg-zinc-950/95 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

        <div className="space-y-4">
          <div>
            <p
              id="cancel-phantom-title"
              className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/90"
            >
              Annulation Mode Fantôme
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">
              Annuler le Mode Fantôme ?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              Cette action concerne{" "}
              <span className="font-medium text-white">{clientName}</span>.
              Elle conserve la demande, l’historique et les écritures
              comptables.
            </p>
          </div>

          <ul className="space-y-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-50/90">
            <li>Statut actuel : {phantomStatusLabelFr[request.status]}</li>
            <li>Trace historique ajoutée : Mode Fantôme annulé</li>
            <li>
              Si {PHANTOM_AMOUNT_EUR}€ ont déjà été comptabilisés, une
              contre-écriture de -{PHANTOM_AMOUNT_EUR}€ sera ajoutée.
            </li>
          </ul>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => onOpenChange(false)}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 justify-center",
              )}
            >
              Fermer
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onConfirm}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-12 justify-center bg-amber-500 text-zinc-950 hover:bg-amber-400",
              )}
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UndoLastUnlockDialog({
  open,
  onOpenChange,
  clientName,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  busy: boolean;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-200 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="undo-unlock-title"
      onClick={() => !busy && onOpenChange(false)}
    >
      <div
        className="mx-auto w-full max-w-lg rounded-t-[1.75rem] border border-white/10 bg-zinc-950/95 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

        <div className="space-y-4">
          <div>
            <p
              id="undo-unlock-title"
              className="text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-200/90"
            >
              Annulation admin
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">
              Annuler le dernier déblocage ?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              Cette action concerne{" "}
              <span className="font-medium text-white">{clientName}</span>.
              Elle garde les preuves et ajoute une contre-écriture auditée.
            </p>
          </div>

          <ul className="space-y-2 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-50/90">
            <li>-1 déblocage sur la carte fidélité</li>
            <li>Correction comptable négative du dernier montant</li>
            <li>Trace historique ajoutée : Déblocage annulé</li>
          </ul>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => onOpenChange(false)}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 justify-center",
              )}
            >
              Fermer
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onConfirm}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-12 justify-center bg-rose-500 text-white hover:bg-rose-400",
              )}
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
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
