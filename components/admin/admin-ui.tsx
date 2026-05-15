import { cn } from "@/lib/utils";

export function badgeFor(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-500/20 text-amber-100 border-amber-500/30";
    case "accepted":
      return "bg-emerald-500/15 text-emerald-100 border-emerald-500/25";
    case "refused":
      return "bg-rose-500/15 text-rose-100 border-rose-500/25";
    case "cancelled":
      return "bg-zinc-500/20 text-zinc-200 border-zinc-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "amber" | "violet" | "emerald" | "rose";
}) {
  const ring =
    accent === "amber"
      ? "border-amber-500/20"
      : accent === "violet"
        ? "border-violet-500/20"
        : accent === "emerald"
          ? "border-emerald-500/20"
          : "border-rose-500/20";
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
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
