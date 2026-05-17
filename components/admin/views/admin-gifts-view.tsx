"use client";

import { useState, useTransition } from "react";
import { Gift, Medal, PackageCheck, Trophy, Users } from "lucide-react";
import { toast } from "sonner";

import { updateGiftRequestAction, upsertGiftAction } from "@/actions/gifts";
import { buttonVariants } from "@/components/ui/button";
import type { AdminGiftsSnapshot } from "@/lib/admin/gifts";
import {
  formatPoints,
  giftRarityLabelFr,
  giftStatusLabelFr,
  pointsReasonLabelFr,
} from "@/lib/gifts/labels";
import type { GiftCatalogItem } from "@/lib/gifts/types";
import { cn } from "@/lib/utils";

type AdminGiftsViewProps = {
  data: AdminGiftsSnapshot;
};

export function AdminGiftsView({ data }: AdminGiftsViewProps) {
  const pendingRequests = data.requests.filter((r) => r.status === "pending");

  return (
    <div className="flex flex-col gap-8 pb-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-amber-200/20 bg-linear-to-br from-zinc-950 via-black to-amber-950/25 p-5 shadow-2xl shadow-black/40">
        <div
          aria-hidden
          className="premium-ambient pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-amber-300/14 blur-3xl"
        />
        <div className="relative space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
            Programme ambassadeur
          </p>
          <h1 className="text-3xl font-semibold tracking-tighter text-white">
            Cadeaux à traiter
          </h1>
          <p className="text-sm leading-relaxed text-zinc-400">
            Demandes cadeaux, boutique, points et parrainage dans un espace
            admin sécurisé.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <AdminGiftStat label="En attente" value={pendingRequests.length} />
        <AdminGiftStat label="Catalogue" value={data.catalog.length} />
        <AdminGiftStat label="Top points" value={data.topPoints.length} />
        <AdminGiftStat label="Parrains" value={data.referrals.filter((r) => r.filleuls_count > 0).length} />
      </section>

      <AdminGiftRequests requests={data.requests} />
      <AdminGiftCatalog catalog={data.catalog} />
      <AdminGiftLeaderboard data={data} />
    </div>
  );
}

function AdminGiftStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function AdminGiftRequests({ requests }: { requests: AdminGiftsSnapshot["requests"] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <PackageCheck className="size-4 text-amber-200" aria-hidden />
        <h2 className="text-lg font-semibold tracking-tight text-white">
          Demandes cadeaux
        </h2>
      </div>
      <ul className="grid gap-3">
        {requests.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-zinc-500">
            Aucune demande cadeau.
          </li>
        ) : (
          requests.map((request) => (
            <AdminGiftRequestCard key={request.id} request={request} />
          ))
        )}
      </ul>
    </section>
  );
}

function AdminGiftRequestCard({
  request,
}: {
  request: AdminGiftsSnapshot["requests"][number];
}) {
  const [tracking, setTracking] = useState(request.tracking_number ?? "");
  const [note, setNote] = useState(request.admin_note ?? "");
  const [busy, start] = useTransition();
  const clientName =
    request.client?.full_name?.trim() ||
    request.client?.email?.trim() ||
    "Client";

  function run(status: "accepted" | "refused" | "sent" | "cancelled") {
    start(async () => {
      const res = await updateGiftRequestAction(request.id, status, tracking, note);
      if (res.ok) {
        toast.success("Demande cadeau mise à jour");
      } else {
        toast.error("Action impossible", { description: res.error });
      }
    });
  }

  return (
    <li className="rounded-[1.75rem] border border-white/10 bg-linear-to-br from-white/[0.06] via-zinc-950 to-black p-4 shadow-xl shadow-black/25">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">
              {request.gift?.name ?? "Cadeau"}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {clientName} · {request.client?.email ?? "email absent"}
              {request.client?.snap ? ` · Snap ${request.client.snap}` : ""}
            </p>
          </div>
          <span className="rounded-full border border-amber-200/15 bg-amber-200/8 px-2.5 py-1 text-[10px] font-semibold text-amber-100">
            {giftStatusLabelFr[request.status]}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <MiniStat label="Points" value={formatPoints(request.points_spent)} />
          <MiniStat
            label="Solde client"
            value={formatPoints(request.client?.points_balance ?? 0)}
          />
        </div>
        <div className="grid gap-2">
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Suivi Mondial Relay"
            className="h-11 rounded-2xl border border-white/10 bg-black/35 px-4 text-sm text-white outline-none focus:border-amber-300/40"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Commentaire admin"
            rows={2}
            className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-amber-300/40"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <AdminActionButton busy={busy} onClick={() => run("accepted")}>
            Accepter
          </AdminActionButton>
          <AdminActionButton busy={busy} onClick={() => run("sent")}>
            Envoyer
          </AdminActionButton>
          <AdminActionButton busy={busy} danger onClick={() => run("refused")}>
            Refuser
          </AdminActionButton>
          <AdminActionButton busy={busy} danger onClick={() => run("cancelled")}>
            Annuler
          </AdminActionButton>
        </div>
      </div>
    </li>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/25 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold text-amber-100">{value}</p>
    </div>
  );
}

function AdminActionButton({
  busy,
  danger,
  onClick,
  children,
}: {
  busy: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "h-10 rounded-full",
        danger
          ? "border-rose-500/30 text-rose-100 hover:bg-rose-500/10"
          : "border-amber-200/25 text-amber-100 hover:bg-amber-300/10",
      )}
    >
      {children}
    </button>
  );
}

function AdminGiftCatalog({ catalog }: { catalog: GiftCatalogItem[] }) {
  const inputClass =
    "min-h-11 rounded-2xl border border-white/10 bg-black/35 px-4 text-sm text-white outline-none focus:border-amber-300/45";

  async function saveGift(formData: FormData) {
    const res = await upsertGiftAction(formData);
    if (res.ok) {
      toast.success("Cadeau enregistré");
    } else {
      toast.error("Enregistrement impossible", { description: res.error });
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Gift className="size-4 text-amber-200" aria-hidden />
        <h2 className="text-lg font-semibold tracking-tight text-white">
          Gestion boutique
        </h2>
      </div>
      <ul className="grid gap-3">
        {catalog.map((gift) => (
          <li key={gift.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
            <form action={saveGift} className="grid gap-3">
              <input type="hidden" name="id" value={gift.id} />
              <input name="name" defaultValue={gift.name} className={inputClass} />
              <textarea
                name="description"
                defaultValue={gift.description}
                rows={2}
                className={cn(inputClass, "min-h-20 py-3")}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="points_price"
                  type="number"
                  defaultValue={gift.points_price}
                  className={inputClass}
                />
                <input
                  name="real_cost_eur"
                  type="number"
                  defaultValue={gift.real_cost_eur}
                  className={inputClass}
                />
              </div>
              <input
                name="image_url"
                defaultValue={gift.image_url ?? ""}
                placeholder="Image URL"
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-2">
                <select name="rarity" defaultValue={gift.rarity} className={inputClass}>
                  {(["rare", "premium", "elite", "legendary"] as const).map((r) => (
                    <option key={r} value={r}>
                      {giftRarityLabelFr[r]}
                    </option>
                  ))}
                </select>
                <input
                  name="sort_order"
                  type="number"
                  defaultValue={gift.sort_order}
                  className={inputClass}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input name="active" type="checkbox" defaultChecked={gift.active} />
                Cadeau actif
              </label>
              <button
                type="submit"
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "rounded-full bg-amber-500 text-zinc-950 hover:bg-amber-400",
                )}
              >
                Enregistrer
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AdminGiftLeaderboard({ data }: { data: AdminGiftsSnapshot }) {
  return (
    <section className="grid gap-3">
      <div className="flex items-center gap-2">
        <Trophy className="size-4 text-amber-200" aria-hidden />
        <h2 className="text-lg font-semibold tracking-tight text-white">
          Points & parrainage
        </h2>
      </div>
      <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">Top points mensuel</h3>
        <ol className="space-y-2">
          {data.topPoints.map((entry, index) => (
            <li key={entry.profile_id} className="flex justify-between text-sm">
              <span className="text-zinc-300">
                {index + 1}. {entry.name}
              </span>
              <span className="font-semibold text-amber-100">
                {formatPoints(entry.points)}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Users className="size-4 text-amber-200" aria-hidden />
          <h3 className="text-sm font-semibold text-white">Parrains actifs</h3>
        </div>
        <ul className="space-y-2">
          {data.referrals
            .filter((r) => r.filleuls_count > 0)
            .slice(0, 10)
            .map((row) => (
              <li key={row.id} className="flex justify-between text-sm">
                <span className="truncate text-zinc-300">
                  {row.full_name?.trim() || row.email || "Client"}
                </span>
                <span className="text-amber-100">{row.filleuls_count} filleul(s)</span>
              </li>
            ))}
        </ul>
      </div>
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Medal className="size-4 text-amber-200" aria-hidden />
          <h3 className="text-sm font-semibold text-white">Historique points récent</h3>
        </div>
        <ul className="space-y-2">
          {data.recentLedger.slice(0, 12).map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-zinc-300">
                {entry.profile?.full_name?.trim() || entry.profile?.email || "Client"} ·{" "}
                {pointsReasonLabelFr[entry.reason] ?? entry.reason}
              </span>
              <span
                className={cn(
                  "shrink-0 font-semibold",
                  entry.points_delta > 0 ? "text-emerald-200" : "text-rose-200",
                )}
              >
                {entry.points_delta > 0 ? "+" : ""}
                {formatPoints(entry.points_delta)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

