type AdminPlaceholderViewProps = {
  title: string;
  description: string;
};

export function AdminPlaceholderView({
  title,
  description,
}: AdminPlaceholderViewProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/60 bg-card/20 px-6 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/80">
        Bientôt
      </p>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
