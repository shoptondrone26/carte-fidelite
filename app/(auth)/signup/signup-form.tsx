"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import { cn } from "@/lib/utils";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [snap, setSnap] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error: signError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          snap: snap.trim(),
        },
      },
    });

    if (signError) {
      setLoading(false);
      setError(signError.message);
      return;
    }

    if (data.user && !data.session) {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (loginError) {
        setLoading(false);
        setError(
          "La confirmation email est encore active côté Supabase Auth. Désactivez-la pour permettre la connexion immédiate.",
        );
        return;
      }
    }

    setLoading(false);
    router.refresh();
    await trackAnalyticsEvent("signup", {}, { dedupeKey: "signup" });
    router.replace("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 pt-[max(2rem,env(safe-area-inset-top))] pb-12">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/90">
          Carte
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Créer un compte
        </h1>
        <p className="text-sm text-muted-foreground">
          Rejoignez le programme fidélité premium.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm"
      >
        <div className="space-y-2">
          <label
            htmlFor="fullName"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Nom
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 transition-shadow focus-visible:ring-3"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="snap"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Snapchat
          </label>
          <input
            id="snap"
            name="snap"
            type="text"
            autoComplete="off"
            required
            value={snap}
            onChange={(e) => setSnap(e.target.value)}
            placeholder="@pseudo"
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 transition-shadow focus-visible:ring-3"
          />
        </div>
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
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring/50 transition-shadow focus-visible:ring-3"
          />
          <p className="text-[11px] text-muted-foreground">
            Au moins 6 caractères (exigence Supabase).
          </p>
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
          {loading ? "Création…" : "S’inscrire"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Connexion
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
