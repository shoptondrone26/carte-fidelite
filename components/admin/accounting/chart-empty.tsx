type ChartEmptyProps = {
  message?: string;
};

export function ChartEmpty({
  message = "Pas encore de données sur cette période.",
}: ChartEmptyProps) {
  return (
    <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 px-4 text-center text-xs text-muted-foreground">
      {message}
    </div>
  );
}
