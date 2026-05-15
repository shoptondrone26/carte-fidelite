import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Hors ligne",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Carte
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
          Vous êtes hors ligne
        </h1>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          Vérifiez votre connexion, puis réessayez. L’application installée se reconnectera
          automatiquement.
        </p>
      </div>
      <Link href="/" className={cn(buttonVariants({ size: "lg" }), "rounded-full")}>
        Retour à l’accueil
      </Link>
    </div>
  );
}
