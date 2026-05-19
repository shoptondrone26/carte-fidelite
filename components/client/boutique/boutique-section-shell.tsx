import type { ReactNode } from "react";

type BoutiqueSectionShellProps = {
  children: ReactNode;
};

export function BoutiqueSectionShell({ children }: BoutiqueSectionShellProps) {
  return (
    <div className="relative flex flex-1 flex-col">
      <div
        aria-hidden
        className="premium-ambient pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(245,158,11,0.12),transparent)]"
      />
      <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-5 pb-8 pt-6">
        {children}
      </main>
    </div>
  );
}
