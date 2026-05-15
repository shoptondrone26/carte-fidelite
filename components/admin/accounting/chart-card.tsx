import type { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function ChartCard({
  title,
  description,
  children,
  className,
}: ChartCardProps) {
  return (
    <article
      className={`rounded-2xl border border-white/10 bg-card/40 p-4 shadow-inner shadow-black/20 ${className ?? ""}`}
    >
      <header className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </article>
  );
}
