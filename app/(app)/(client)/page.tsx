import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  Crown,
  Gem,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const privilegeCards = [
  {
    title: "Accès prioritaire",
    description: "Réservation accélérée pour les membres privés.",
    icon: Zap,
  },
  {
    title: "Déblocages exclusifs",
    description: "Récompenses accessibles uniquement aux membres actifs.",
    icon: Gem,
  },
  {
    title: "Réservations privées",
    description: "Créneaux fluides, pensés pour une expérience rapide.",
    icon: CalendarDays,
  },
  {
    title: "Avantages membres",
    description: "Privilèges débloqués progressivement à chaque visite.",
    icon: Crown,
  },
];

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-[#050505]">
      <div
        aria-hidden
        className="premium-ambient pointer-events-none absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_-10%,rgba(245,158,11,0.26),transparent_54%),radial-gradient(90%_55%_at_100%_10%,rgba(251,191,36,0.12),transparent_48%),radial-gradient(70%_45%_at_0%_72%,rgba(255,255,255,0.055),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.045),transparent_32%)]"
      />
      <div
        aria-hidden
        className="premium-ambient pointer-events-none absolute inset-x-8 top-24 h-36 rounded-full bg-amber-400/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-80 size-72 -translate-x-1/2 rounded-full border border-amber-200/10 bg-amber-200/[0.035] blur-2xl"
      />

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col gap-12 px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.18em] text-amber-100 drop-shadow-[0_0_18px_rgba(251,191,36,0.18)]">
            <span className="inline-flex size-9 items-center justify-center rounded-full border border-amber-300/25 bg-white/5 text-amber-200 shadow-sm shadow-amber-500/20 backdrop-blur-xl">
              <Sparkles className="size-4" aria-hidden />
            </span>
            SHOPTONDRONE PRIVÉ
          </div>
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-100">
            Réservé aux membres
          </span>
        </header>

        <section className="flex flex-col gap-8 pt-3">
          <div className="space-y-5">
            <p className="premium-shimmer w-fit bg-linear-to-r from-amber-100 via-white to-amber-300 bg-clip-text text-xs font-semibold uppercase tracking-[0.36em] text-transparent">
              Club privé · Accès limité
            </p>
            <h1 className="text-balance text-5xl font-semibold leading-[0.96] tracking-tighter text-white sm:text-[3.35rem]">
              Chaque visite débloque davantage.
            </h1>
            <p className="max-w-prose text-pretty text-base leading-relaxed text-zinc-400">
              Une expérience fidélité pensée comme un espace privé, fluide et
              exclusif.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-12 min-h-12 w-full justify-center rounded-full bg-amber-300 text-zinc-950 shadow-lg shadow-amber-500/20 transition duration-500 hover:bg-amber-200 sm:w-auto",
              )}
            >
              Accéder à mon espace
            </Link>
            <Link
              href="/offres"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 min-h-12 w-full justify-center rounded-full border-amber-200/20 bg-white/5 text-amber-50 transition duration-500 hover:bg-amber-200/10 sm:w-auto",
              )}
            >
              Découvrir les privilèges
            </Link>
          </div>
        </section>

        <section className="relative">
          <div
            aria-hidden
            className="premium-ambient absolute inset-6 rounded-full bg-amber-300/20 blur-3xl"
          />
          <div className="premium-float relative overflow-hidden rounded-[2rem] border border-amber-200/15 bg-linear-to-br from-zinc-900 via-black to-zinc-950 p-5 shadow-2xl shadow-black/60 transition duration-700 active:scale-[0.985] sm:hover:scale-[1.01]">
            <div
              aria-hidden
              className="absolute -right-12 -top-12 size-40 rounded-full bg-amber-200/15 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-amber-200/60 to-transparent"
            />
            <div className="relative flex min-h-64 flex-col justify-between overflow-hidden rounded-[1.5rem] border border-white/10 bg-[radial-gradient(100%_80%_at_100%_0%,rgba(251,191,36,0.18),transparent_45%),linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.025)_36%,rgba(0,0,0,0.46))] p-5 shadow-inner shadow-white/5">
              <div
                aria-hidden
                className="premium-sheen pointer-events-none absolute inset-y-[-20%] left-0 w-1/2 bg-linear-to-r from-transparent via-white/20 to-transparent blur-sm"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.45)_1px,transparent_0)] bg-size-[18px_18px] opacity-[0.16]"
              />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-100/80">
                    Membre privé
                  </p>
                  <p className="mt-2 text-xl font-semibold tracking-tight text-white">
                    ShopTonDrone
                  </p>
                </div>
                <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-100">
                  Private member
                </span>
              </div>
              <div className="relative space-y-7">
                <div className="flex items-center justify-between gap-4">
                  <div className="h-10 w-14 rounded-xl border border-amber-100/25 bg-linear-to-br from-amber-200/35 via-white/10 to-transparent shadow-[0_0_24px_rgba(251,191,36,0.12)]" />
                  <LockKeyhole className="size-5 text-amber-100/80" aria-hidden />
                </div>
                <div className="space-y-3">
                  <p className="font-mono text-lg tracking-[0.32em] text-zinc-100">
                    8888&nbsp;&nbsp;••••&nbsp;&nbsp;••••&nbsp;&nbsp;2026
                  </p>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-zinc-500">
                        Nom membre
                      </p>
                      <p className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-100">
                        Membre actif
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.35em] text-zinc-500">
                        Niveau
                      </p>
                      <p className="mt-1 text-sm font-semibold text-amber-100">
                        Gold privé
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/30 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-200/80">
                Votre statut
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
                Progression membre
              </h2>
            </div>
            <span className="flex size-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatusMetric label="Visites" value="2 / 3" />
            <StatusMetric label="Badge" value="Privé" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Prochain privilège</span>
              <span className="font-medium text-amber-100">Récompense premium</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="premium-progress h-full w-2/3 origin-left rounded-full bg-linear-to-r from-amber-500 via-amber-200 to-white shadow-[0_0_18px_rgba(251,191,36,0.35)]" />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-amber-200/15 bg-amber-200/6 px-3 py-2 text-xs text-amber-100/90">
            <BadgeCheck className="size-4 shrink-0" aria-hidden />
            Accès prioritaire actif · Avantages débloqués progressivement
          </div>
        </section>

        <section id="privileges" className="space-y-4">
          <div className="flex items-center gap-2">
            <Gem className="size-4 text-amber-200" aria-hidden />
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Privilèges
            </h2>
          </div>
          <ul className="grid gap-3">
            {privilegeCards.map((privilege) => {
              const Icon = privilege.icon;
              return (
                <li
                  key={privilege.title}
                  className="group rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4 shadow-lg shadow-black/20 backdrop-blur-xl transition duration-700 active:scale-[0.985] sm:hover:-translate-y-1 sm:hover:border-amber-200/25 sm:hover:bg-amber-200/5.5"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/10 text-amber-100 transition duration-700 group-hover:shadow-[0_0_24px_rgba(251,191,36,0.16)]">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-semibold tracking-tight text-white">
                        {privilege.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                        {privilege.description}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-[1.75rem] border border-amber-200/15 bg-amber-200/6 p-5 shadow-xl shadow-amber-950/20 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-300/15 text-amber-100">
              <CalendarDays className="size-5" aria-hidden />
            </span>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight text-white">
                Réservation
              </h2>
              <p className="text-sm font-medium text-amber-100">
                Créneaux réservés aux membres.
              </p>
              <p className="text-sm leading-relaxed text-zinc-400">
                Une réservation fluide, un accès privilégié et une expérience
                rapide à chaque passage.
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-amber-200/70">
                Réservé aux membres actifs
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
