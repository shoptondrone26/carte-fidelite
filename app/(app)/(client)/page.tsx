import Link from "next/link";
import { Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(251,191,36,0.18),transparent_55%),radial-gradient(90%_60%_at_100%_0%,rgba(120,113,198,0.12),transparent_50%),radial-gradient(70%_50%_at_0%_100%,rgba(56,189,248,0.08),transparent_45%)]"
      />
      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <header className="mb-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium tracking-tight text-muted-foreground">
            <span className="inline-flex size-9 items-center justify-center rounded-full border border-border/70 bg-card/60 text-amber-200 shadow-sm shadow-amber-500/10">
              <Sparkles className="size-4" aria-hidden />
            </span>
            Carte
          </div>
          <span className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Premium
          </span>
        </header>

        <section className="flex flex-1 flex-col justify-center gap-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/90">
              Fidélité, réinventée
            </p>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[2.75rem]">
              Votre carte premium, toujours à portée de main.
            </h1>
            <p className="max-w-prose text-pretty text-base leading-relaxed text-muted-foreground">
              Une expérience mobile-first, sobre et luxueuse — pensée pour
              récompenser chaque visite, sans friction.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/carte"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-11 min-h-11 w-full justify-center sm:w-auto",
              )}
            >
              Découvrir la carte
            </Link>
            <Link
              href="/offres"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 min-h-11 w-full justify-center sm:w-auto",
              )}
            >
              Voir les offres
            </Link>
          </div>

          <ul className="grid gap-3 rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm">
            {[
              "Design sombre et contrastes soignés pour lecture en salle.",
              "Navigation basse accessible au pouce, safe areas iPhone.",
              "Base prête pour PWA, Supabase et parcours métier.",
            ].map((line) => (
              <li
                key={line}
                className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-300/80" />
                {line}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
