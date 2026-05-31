import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { getIsAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ShopTonDrone Privé",
  description:
    "Accès privé, réservation prioritaire et expérience premium ShopTonDrone.",
};

const features = [
  {
    title: "Réservation prioritaire",
    description: "Créneaux réservés aux membres.",
    icon: CalendarCheck,
  },
  {
    title: "Boutique privée",
    description: "Catalogue et drops réservés aux membres.",
    icon: ShoppingBag,
  },
  {
    title: "Notifications temps réel",
    description: "Réservation, expédition, statut commande.",
    icon: BellRing,
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = user ? await getIsAdmin(supabase, user.id) : false;
  const primaryHref = !user ? "/login?next=/dashboard" : isAdmin ? "/admin" : "/dashboard";
  const primaryLabel = !user
    ? "Accéder à mon espace"
    : isAdmin
      ? "Tableau de bord admin"
      : "Accéder à mon espace";
  const showLoginHint = !user;

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-[#050505]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_-10%,rgba(245,158,11,0.18),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_30%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-12 top-24 h-32 rounded-full bg-amber-400/12 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col gap-10 px-5 pb-10 pt-[max(2.25rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.32em] text-amber-100/85">
            <span className="inline-flex size-7 items-center justify-center rounded-full border border-amber-300/25 bg-white/5 text-amber-200">
              <ShieldCheck className="size-3.5" aria-hidden />
            </span>
            SHOPTONDRONE PRIVÉ
          </div>
          {showLoginHint ? (
            <Link
              href="/login"
              className="text-xs font-medium text-zinc-400 underline-offset-4 hover:text-amber-100 hover:underline"
            >
              Se connecter
            </Link>
          ) : (
            <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-100">
              Connecté
            </span>
          )}
        </header>

        <section className="space-y-7 pt-6">
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-amber-200/80">
              Club privé · Accès limité
            </p>
            <h1 className="text-balance text-[2.65rem] font-semibold leading-[1.02] tracking-tighter text-white sm:text-5xl">
              Accès privé.
              <br />
              Réservation prioritaire.
              <br />
              <span className="text-amber-200">Club membre.</span>
            </h1>
            <p className="max-w-[28ch] text-sm leading-relaxed text-zinc-400">
              Un espace privé réservé aux membres ShopTonDrone.
              <br />
              Réservez, commandez et suivez vos services depuis un seul espace.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              href={primaryHref}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-12 w-full justify-center rounded-full bg-amber-300 text-zinc-950 shadow-md shadow-amber-500/20 transition active:scale-[0.99] hover:bg-amber-200",
              )}
            >
              {primaryLabel}
            </Link>
            <Link
              href="/boutique"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 w-full justify-center rounded-full border-white/15 bg-white/5 text-amber-50 transition active:scale-[0.99] hover:bg-white/10",
              )}
            >
              Boutique privée
            </Link>
          </div>
        </section>

        <section className="grid gap-2.5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3 px-4 py-3.5 backdrop-blur-xl"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-amber-200/15 bg-amber-200/10 text-amber-100">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold tracking-tight text-white">
                    {feature.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                    {feature.description}
                  </p>
                </div>
              </article>
            );
          })}
        </section>

        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-6 rounded-full bg-amber-300/12 blur-3xl"
          />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-amber-200/15 bg-linear-to-br from-zinc-900 via-black to-zinc-950 p-4 shadow-xl shadow-black/50">
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-amber-200/50 to-transparent"
            />
            <div
              aria-hidden
              className="absolute -right-10 -top-10 size-32 rounded-full bg-amber-200/12 blur-3xl"
            />
            <div className="relative flex items-center justify-between gap-4 rounded-[1.25rem] border border-white/10 bg-[radial-gradient(100%_80%_at_100%_0%,rgba(251,191,36,0.16),transparent_45%),linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.02)_36%,rgba(0,0,0,0.46))] p-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-100/80">
                  Carte membre
                </p>
                <p className="mt-2 font-mono text-sm tracking-[0.28em] text-zinc-100">
                  •••• •••• 2026
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.28em] text-zinc-500">
                  Accès privé
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-100">
                Private
              </span>
            </div>
          </div>
        </section>

        {showLoginHint ? (
          <p className="text-center text-xs text-zinc-500">
            Pas encore de compte ?{" "}
            <Link
              href="/signup"
              className="font-medium text-amber-200 underline-offset-4 hover:underline"
            >
              S’inscrire
            </Link>
          </p>
        ) : (
          <Link
            href={primaryHref}
            className="group flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-200/85 hover:text-amber-100"
          >
            Continuer vers mon espace
            <ArrowRight
              className="size-3.5 transition group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        )}
      </div>
    </main>
  );
}
