import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardLive } from "@/components/client/dashboard-live";
import { PushSettingsPanel } from "@/components/notifications/push-settings-panel";
import { signOut } from "@/actions/auth";
import { getIsAdmin } from "@/lib/auth/roles";
import type { ClientLoyaltySnapshot } from "@/lib/realtime/client-loyalty";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon espace",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  if (await getIsAdmin(supabase, user.id)) {
    redirect("/admin");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, created_at, total_unlocks, push_enabled")
    .eq("id", user.id)
    .maybeSingle();

  const { data: historyRows } = await supabase
    .from("history")
    .select("id, event_type, created_at")
    .eq("subject_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: freeUsedHistory } = await supabase
    .from("history")
    .select("id, created_at")
    .eq("subject_id", user.id)
    .eq("event_type", "free_used")
    .order("created_at", { ascending: false })
    .limit(12);

  const { count: freeUsedCount } = await supabase
    .from("history")
    .select("id", { count: "exact", head: true })
    .eq("subject_id", user.id)
    .eq("event_type", "free_used");

  const displayName =
    profile?.full_name?.trim() ||
    profile?.email?.trim() ||
    user.email ||
    "Membre";

  const loyaltyInitial: ClientLoyaltySnapshot = {
    totalUnlocks: profile?.total_unlocks ?? 0,
    historyItems: historyRows ?? [],
    freeUsedHistory: freeUsedHistory ?? [],
    freeUsedCount: freeUsedCount ?? 0,
  };

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Mon espace
          </h1>
          <p className="text-xs text-muted-foreground">
            Votre carte premium et votre progression.
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground",
            )}
          >
            Déconnexion
          </button>
        </form>
      </header>

      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </p>
      ) : null}

      {profile ? (
        <>
          <PushSettingsPanel initialEnabled={profile.push_enabled ?? true} />
          <DashboardLive
            userId={user.id}
            displayName={displayName}
            initial={loyaltyInitial}
          />
        </>
      ) : (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Profil introuvable. Le trigger sur{" "}
          <code className="rounded bg-black/30 px-1">auth.users</code> doit
          créer la ligne{" "}
          <code className="rounded bg-black/30 px-1">profiles</code> et le rôle{" "}
          <code className="rounded bg-black/30 px-1">customer</code> à
          l&apos;inscription.
        </p>
      )}
    </main>
  );
}
