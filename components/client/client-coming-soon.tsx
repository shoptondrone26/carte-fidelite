import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

type ClientComingSoonProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
};

export function ClientComingSoon({
  title,
  description,
  icon: Icon,
  badge = "Bientôt disponible",
}: ClientComingSoonProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-200/20 bg-linear-to-br from-zinc-950 via-black to-amber-950/15 p-6 shadow-2xl shadow-amber-950/20">
      <div
        aria-hidden
        className="premium-ambient pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-amber-300/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-amber-100/50 to-transparent"
      />
      <div className="relative flex flex-col items-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl border border-amber-200/25 bg-amber-300/10 text-amber-100 shadow-[0_0_28px_rgba(245,158,11,0.12)]">
          <Icon className="size-7" aria-hidden />
        </span>
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-100">
            <Sparkles className="size-3" aria-hidden />
            {badge}
          </span>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            {title}
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
