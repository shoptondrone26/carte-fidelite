import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Connexion",
};

function LoginFormFallback() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="h-10 animate-pulse rounded-lg bg-muted/50" />
      <div className="h-32 animate-pulse rounded-2xl bg-muted/40" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
