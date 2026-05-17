"use client";

import { useMemo, useTransition } from "react";
import { Gift, Link as LinkIcon, Medal, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";

import { redeemGiftAction } from "@/actions/gifts";
import { buttonVariants } from "@/components/ui/button";
import { useClientPointsRealtime } from "@/hooks/use-client-points-realtime";
import {
  formatPoints,
  giftRarityLabelFr,
  giftStatusLabelFr,
  pointsReasonLabelFr,
} from "@/lib/gifts/labels";
import type { ClientPointsSnapshot, GiftCatalogItem } from "@/lib/gifts/types";
import { cn } from "@/lib/utils";

type GiftShopPanelProps = {
  userId: string;
  initial: ClientPointsSnapshot;
};

const rarityTone: Record<GiftCatalogItem["rarity"], string> = {
  rare: "border-amber-200/20 bg-amber-200/10 text-amber-100",
  premium: "border-violet-200/20 bg-violet-300/10 text-violet-100",
  elite: "border-sky-200/20 bg-sky-300/10 text-sky-100",
  legendary: "border-rose-200/25 bg-rose-300/10 text-rose-100",
};

export function GiftShopPanel({ userId, initial }: GiftShopPanelProps) {
  const points = useClientPointsRealtime(userId, initial);
  const [pending, start] = useTransition();
  const referralUrl = useMemo(() => {
    if (!points.referralCode || typeof window === "undefined") return "";
    return `${window.location.origin}/signup?ref=${points.referralCode}`;
  }, [points.referralCode]);

  function redeem(gift: GiftCatalogItem) {
    start(async () => {
      const res = await redeemGiftAction(gift.id);
      if (res.ok) {
        toast.success("Cadeau demandé", {
          description: `${gift.name} · -${formatPoints(gift.points_price)} points`,
        });
      } else {
        toast.error("Demande impossible", { description: res.error });
      }
    });
  }

  async function copyReferral() {
    if (!referralUrl) return;
    await navigator.clipboard?.writeText(referralUrl);
    toast.success("Lien parrainage copié");
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-amber-200/20 bg-linear-to-br from-amber-300/12 via-zinc-950 to-black p-5 shadow-2xl shadow-black/30">
        <div
          aria-hidden
          className="premium-ambient pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-amber-300/18 blur-3xl"
        />
        <div className="relative space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
            Boutique cadeaux
          </p>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-zinc-400">Solde disponible</p>
              <p className="text-4xl font-semibold tracking-tighter text-white">
                {formatPoints(points.pointsBalance)}
              </p>
            </div>
            <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-xs font-semibold text-amber-100">
              points
            </span>
          </div>
          {points.referralCode ? (
            <button
              type="button"
              onClick={copyReferral}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-left transition active:scale-[0.99]"
            >
              <span>
                <span className="block text-xs text-zinc-500">Lien parrainage</span>
                <span className="block text-sm font-semibold text-amber-100">
                  {points.referralCode}
                </span>
              </span>
              <LinkIcon className="size-4 text-amber-200" aria-hidden />
            </button>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Gift className="size-4 text-amber-200" aria-hidden />
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Cadeaux exclusifs
          </h2>
        </div>
        <ul className="grid gap-3">
          {points.gifts.map((gift) => {
            const affordable = points.pointsBalance >= gift.points_price;
            return (
              <li
                key={gift.id}
                className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-linear-to-br from-white/[0.07] via-white/2.5 to-amber-300/4 p-4 shadow-xl shadow-black/25"
              >
                <div
                  aria-hidden
                  className="absolute -right-8 -top-8 size-28 rounded-full bg-amber-200/10 blur-3xl"
                />
                <div className="relative space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold tracking-tight text-white">
                        {gift.name}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                        {gift.description}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                        rarityTone[gift.rarity],
                      )}
                    >
                      {giftRarityLabelFr[gift.rarity]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-lg font-semibold text-amber-100">
                      {formatPoints(gift.points_price)} pts
                    </span>
                    <button
                      type="button"
                      disabled={pending || !affordable}
                      onClick={() => redeem(gift)}
                      className={cn(
                        buttonVariants({ variant: "default", size: "sm" }),
                        "rounded-full bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:opacity-45",
                      )}
                    >
                      {affordable ? "Demander" : "Solde insuffisant"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-white">
          Classement mensuel
        </h2>
        <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-4">
          <ol className="space-y-2">
            {points.leaderboard.length === 0 ? (
              <li className="text-sm text-zinc-500">Aucun point gagné ce mois-ci.</li>
            ) : (
              points.leaderboard.map((entry, index) => (
                <li
                  key={entry.profile_id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm text-zinc-200">
                    <Trophy className="size-4 text-amber-200" aria-hidden />
                    {index + 1}. {entry.name}
                  </span>
                  <span className="text-sm font-semibold text-amber-100">
                    {formatPoints(entry.points)}
                  </span>
                </li>
              ))
            )}
          </ol>
          {points.personalRank ? (
            <p className="mt-3 rounded-2xl border border-amber-200/15 bg-amber-200/8 px-3 py-2 text-sm text-amber-100">
              Votre position : #{points.personalRank}
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3">
        <HistoryBlock title="Demandes cadeaux" icon="gift">
          {points.requests.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucune demande cadeau.</p>
          ) : (
            points.requests.map((request) => (
              <div key={request.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-zinc-200">
                  {request.gift?.name ?? "Cadeau"}
                </span>
                <span className="shrink-0 text-xs text-amber-100">
                  {giftStatusLabelFr[request.status]}
                </span>
              </div>
            ))
          )}
        </HistoryBlock>
        <HistoryBlock title="Historique points" icon="points">
          {points.ledger.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun mouvement de points.</p>
          ) : (
            points.ledger.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-zinc-300">
                  {pointsReasonLabelFr[entry.reason] ?? entry.reason}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-semibold tabular-nums",
                    entry.points_delta > 0 ? "text-emerald-200" : "text-rose-200",
                  )}
                >
                  {entry.points_delta > 0 ? "+" : ""}
                  {formatPoints(entry.points_delta)}
                </span>
              </div>
            ))
          )}
        </HistoryBlock>
      </section>
    </div>
  );
}

function HistoryBlock({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon: "gift" | "points";
}) {
  const Icon = icon === "gift" ? Sparkles : Medal;
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-amber-200" aria-hidden />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

