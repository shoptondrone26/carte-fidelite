"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signError) {
      setError(signError.message);
      return;
    }

    router.refresh();
    router.replace(next.startsWith("/") ? next : "/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 pt-[max(2rem,env(safe-area-inset-top))] pb-12">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/90">
          Carte
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Connexion
        </h1>
        <p className="text-sm text-muted-foreground">
          Accédez à votre espace fidélité.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm"
      >
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 transition-shadow focus-visible:ring-3"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 transition-shadow focus-visible:ring-3"
          />
        </div>

        {error ? (
          <p className="text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "h-11 w-full justify-center",
          )}
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          S’inscrire
        </Link>
      </p>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/" className="underline-offset-4 hover:underline">
          Retour à l’accueil
        </Link>
      </p>
    </div>
  );
}
