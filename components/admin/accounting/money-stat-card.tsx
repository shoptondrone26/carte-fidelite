import { cn } from "@/lib/utils";

type MoneyStatCardProps = {
  label: string;
  value: string;
  accent?: "amber" | "violet" | "emerald" | "zinc";
};

export function MoneyStatCard({
  label,
  value,
  accent = "amber",
}: MoneyStatCardProps) {
  const ring =
    accent === "amber"
      ? "border-amber-500/25"
      : accent === "violet"
        ? "border-violet-500/25"
        : accent === "emerald"
          ? "border-emerald-500/25"
          : "border-white/10";

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card/50 p-4 shadow-inner shadow-black/20",
        ring,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  );
}
