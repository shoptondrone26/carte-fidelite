"use client";

import {
  BadgeCheck,
  Crown,
  Gem,
  type LucideIcon,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useClientLoyaltyRealtime } from "@/hooks/use-client-loyalty-realtime";
import {
  getFreeAvailable,
  getFreeEarned,
} from "@/lib/loyalty/free-rewards";
import {
  getCycleProgress,
  getVipLevel,
  vipLevelLabelFr,
} from "@/lib/loyalty/vip";
import type { ClientLoyaltySnapshot } from "@/lib/realtime/client-loyalty";

type AdvantagesLiveProps = {
  userId: string;
  initial: ClientLoyaltySnapshot;
};

export function AdvantagesLive({ userId, initial }: AdvantagesLiveProps) {
  const loyalty = useClientLoyaltyRealtime(userId, initial);
  const totalUnlocks = loyalty.totalUnlocks;
  const cycle = getCycleProgress(totalUnlocks);
  const vipLevel = getVipLevel(totalUnlocks);
  const vipLabel = vipLevelLabelFr[vipLevel];
  const freeEarned = getFreeEarned(totalUnlocks);
  const freeUsed = loyalty.freeUsedCount;
  const freeAvailable = getFreeAvailable(freeEarned, freeUsed);
  const nextLabel =
    cycle.current === 0 && totalUnlocks > 0
      ? "Nouvelle récompense à activer"
      : `${cycle.max - cycle.current} visite${cycle.max - cycle.current > 1 ? "s" : ""} avant le prochain avantage`;

  const unlockedRewards = [
    {
      title: "Accès prioritaire",
      detail: "Actif sur votre espace membre.",
    },
    {
      title: "Récompenses disponibles",
      detail: `${freeAvailable} avantage${freeAvailable > 1 ? "s" : ""} à utiliser.`,
    },
    {
      title: "Statut membre",
      detail: `Niveau ${vipLabel}, mis à jour en temps réel.`,
    },
  ];

  return (
    <>
      <section className="premium-float relative overflow-hidden rounded-[2rem] border border-white/10 bg-linear-to-br from-zinc-900 via-black to-zinc-950 p-5 shadow-2xl shadow-black/50">
        <div
          aria-hidden
          className="absolute -right-12 -top-12 size-40 rounded-full bg-amber-200/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-amber-200/50 to-transparent"
        />
        <div className="relative space-y-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-zinc-500">
                Votre statut
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Membre {vipLabel}
              </p>
            </div>
            <span className="flex size-12 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-200/10 text-amber-100">
              <Crown className="size-6" aria-hidden />
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Metric label="Visites" value={String(totalUnlocks)} />
            <Metric label="Niveau" value={vipLabel} />
            <Metric label="Accès" value="Actif" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Progression membre</span>
              <span className="font-medium text-amber-100">{cycle.label}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="premium-progress h-full origin-left rounded-full bg-linear-to-r from-amber-500 via-amber-200 to-white shadow-[0_0_22px_rgba(251,191,36,0.32)] transition-[width] duration-700"
                style={{ width: `${cycle.percent}%` }}
              />
            </div>
            <p className="text-xs leading-relaxed text-zinc-500">
              Prochain avantage : {nextLabel}.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <PersonalCard
          icon={ShieldCheck}
          title="Accès actif"
          text="Accès prioritaire disponible."
        />
        <PersonalCard
          icon={Sparkles}
          title="Progression"
          text="Avantages mis à jour en direct."
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Gem className="size-4 text-amber-200" aria-hidden />
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Avantages débloqués
          </h2>
        </div>
        <ul className="grid gap-3">
          {unlockedRewards.map((reward) => (
            <li
              key={reward.title}
              className="group rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4 shadow-lg shadow-black/20 backdrop-blur-xl transition duration-700 active:scale-[0.985] sm:hover:border-amber-200/20 sm:hover:bg-white/5.5"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/10 text-amber-100">
                  <BadgeCheck className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold tracking-tight text-white">
                    {reward.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                    {reward.detail}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-3 py-3 text-center">
      <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function PersonalCard({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl transition duration-700 active:scale-[0.985] sm:hover:-translate-y-1">
      <span className="flex size-10 items-center justify-center rounded-2xl bg-amber-200/10 text-amber-100">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="mt-4 font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-zinc-400">{text}</p>
    </article>
  );
}
