import Link from "next/link";
import { CalendarDays, Crown, Gem, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const privileges = [
  "Accès prioritaire",
  "Déblocages exclusifs",
  "Réservations privées",
  "Avantages membres",
  "Récompenses premium",
];

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-[#050505]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_-10%,rgba(245,158,11,0.22),transparent_54%),radial-gradient(90%_55%_at_100%_10%,rgba(251,191,36,0.10),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.045),transparent_32%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-24 h-32 rounded-full bg-amber-400/10 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col gap-10 px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.18em] text-amber-100">
            <span className="inline-flex size-9 items-center justify-center rounded-full border border-amber-300/25 bg-white/5 text-amber-200 shadow-sm shadow-amber-500/20">
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
            <p className="text-xs font-semibold uppercase tracking-[0.36em] text-amber-200/80">
              Club privé
            </p>
            <h1 className="text-balance text-5xl font-semibold leading-[0.96] tracking-[-0.05em] text-white sm:text-[3.35rem]">
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
            className="absolute inset-8 rounded-full bg-amber-300/15 blur-3xl"
          />
          <div className="relative overflow-hidden rounded-[2rem] border border-amber-200/15 bg-linear-to-br from-zinc-900 via-black to-zinc-950 p-5 shadow-2xl shadow-black/60">
            <div
              aria-hidden
              className="absolute -right-12 -top-12 size-40 rounded-full bg-amber-200/10 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-amber-200/60 to-transparent"
            />
            <div className="relative flex min-h-56 flex-col justify-between rounded-[1.5rem] border border-white/10 bg-[radial-gradient(100%_80%_at_100%_0%,rgba(251,191,36,0.18),transparent_45%),linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02)_38%,rgba(0,0,0,0.35))] p-5 shadow-inner shadow-white/5 animate-[pulse_7s_ease-in-out_infinite]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-100/80">
                    Statut membre
                  </p>
                  <p className="mt-2 text-xl font-semibold tracking-tight text-white">
                    Privé
                  </p>
                </div>
                <Crown className="size-6 text-amber-200" aria-hidden />
              </div>
              <div className="space-y-4">
                <div className="h-10 w-14 rounded-xl border border-amber-100/20 bg-linear-to-br from-amber-200/30 to-transparent" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500">
                    ShopTonDrone
                  </p>
                  <p className="mt-1 font-mono text-sm tracking-[0.28em] text-zinc-200">
                    PRIVÉ 2026
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="privileges" className="space-y-3">
          <div className="flex items-center gap-2">
            <Gem className="size-4 text-amber-200" aria-hidden />
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Privilèges
            </h2>
          </div>
          <ul className="grid gap-2">
            {privileges.map((line) => (
              <li
                key={line}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-zinc-300"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.6)]" />
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[1.75rem] border border-amber-200/15 bg-amber-200/[0.06] p-5">
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
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
