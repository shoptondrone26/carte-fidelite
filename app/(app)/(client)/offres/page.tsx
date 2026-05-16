import {
  CalendarDays,
  Crown,
  Diamond,
  Gem,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

const vipPrivileges = [
  {
    title: "Drop membre privé",
    label: "Accès limité",
    description: "Des avantages rares proposés en priorité aux membres actifs.",
    icon: Diamond,
  },
  {
    title: "Expérience privée",
    label: "Réservé membres",
    description: "Un accès pensé pour prolonger l’univers ShopTonDrone Privé.",
    icon: Crown,
  },
  {
    title: "Réservation VIP",
    label: "Prioritaire",
    description: "Une expérience rapide, fluide et privilégiée.",
    icon: CalendarDays,
  },
];

const limitedRewards = [
  "Avantage exclusif",
  "Disponible pour une durée limitée",
  "Récompense spéciale",
];

export default function OffresPage() {
  return (
    <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 overflow-hidden px-5 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div
        aria-hidden
        className="premium-ambient pointer-events-none absolute inset-x-4 top-12 h-56 rounded-full bg-amber-300/18 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-48 size-44 rounded-full border border-amber-200/15 bg-white/[0.035] blur-2xl"
      />

      <header className="relative space-y-3">
        <p className="premium-shimmer w-fit bg-linear-to-r from-amber-100 via-white to-amber-300 bg-clip-text text-xs font-semibold uppercase tracking-[0.32em] text-transparent">
          Exclusivités ShopTonDrone
        </p>
        <h1 className="text-4xl font-semibold tracking-tighter text-white">
          Privilèges
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
          Drops limités, accès VIP et expériences premium réservées aux membres
          actifs.
        </p>
      </header>

      <section className="relative overflow-hidden rounded-[2rem] border border-amber-200/20 bg-linear-to-br from-amber-300/12 via-zinc-950 to-black p-5 shadow-2xl shadow-amber-950/30">
        <div
          aria-hidden
          className="premium-sheen pointer-events-none absolute inset-y-[-20%] left-0 w-1/2 bg-linear-to-r from-transparent via-white/20 to-transparent blur-sm"
        />
        <div
          aria-hidden
          className="absolute -right-10 -top-10 size-36 rounded-full bg-amber-200/20 blur-3xl"
        />
        <div className="relative flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-amber-100/25 bg-amber-200/15 text-amber-100 shadow-[0_0_28px_rgba(251,191,36,0.18)]">
            <LockKeyhole className="size-6" aria-hidden />
          </span>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-100/80">
              Accès limité
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Cercle privé
            </h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              Une sélection rare, pensée pour donner aux membres la sensation de
              débloquer quelque chose d’unique.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Gem className="size-4 text-amber-200" aria-hidden />
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Expériences membres
          </h2>
        </div>
        <ul className="grid gap-3">
          {vipPrivileges.map((privilege) => {
            const Icon = privilege.icon;
            return (
              <li
                key={privilege.title}
                className="group relative overflow-hidden rounded-[1.5rem] border border-amber-200/15 bg-linear-to-br from-white/[0.07] via-white/2.5 to-amber-300/4 p-4 shadow-xl shadow-black/25 backdrop-blur-xl transition duration-700 active:scale-[0.985] sm:hover:-translate-y-1 sm:hover:border-amber-200/35"
              >
                <div
                  aria-hidden
                  className="absolute -right-8 -top-8 size-24 rounded-full bg-amber-200/10 blur-2xl transition duration-700 group-hover:bg-amber-200/18"
                />
                <div className="relative flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-200/12 text-amber-100">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold tracking-tight text-white">
                        {privilege.title}
                      </h3>
                      <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-100">
                        {privilege.label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      {privilege.description}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-black/25 p-5 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-200" aria-hidden />
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Drops & offres limitées
          </h2>
        </div>
        <ul className="mt-4 grid gap-2">
          {limitedRewards.map((reward) => (
            <li
              key={reward}
              className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200/10 bg-amber-200/4.5 px-4 py-3 text-sm text-amber-50"
            >
              <span>{reward}</span>
              <span className="shrink-0 rounded-full bg-black/35 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-amber-200/80">
                VIP
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
