import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DeblocageLive } from "@/components/deblocage/deblocage-live";
import type { ClientLoyaltySnapshot } from "@/lib/realtime/client-loyalty";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Réserver un déblocage",
};

export default async function DeblocagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/deblocage");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, total_unlocks")
    .eq("id", user.id)
    .maybeSingle();

  const nowIso = new Date().toISOString();

  const { data: pendingRow } = await supabase
    .from("bookings")
    .select("id, created_at, starts_at, status")
    .eq("profile_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  const { data: acceptedRow } = pendingRow
    ? { data: null }
    : await supabase
        .from("bookings")
        .select("id, created_at, starts_at, status")
        .eq("profile_id", user.id)
        .eq("status", "accepted")
        .gt("starts_at", nowIso)
        .order("starts_at", { ascending: true })
        .limit(1)
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
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-5 pb-8 pt-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/90">
          Fidélité
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Réserver un déblocage
        </h1>
        <p className="text-sm text-muted-foreground">
          Une demande à la fois : validation par l&apos;équipe.
        </p>
      </header>

      <DeblocageLive
        userId={user.id}
        displayName={displayName}
        initialPending={
          pendingRow ?? acceptedRow
            ? {
                id: (pendingRow ?? acceptedRow)!.id,
                created_at: (pendingRow ?? acceptedRow)!.created_at,
                starts_at: (pendingRow ?? acceptedRow)!.starts_at,
                status: (pendingRow ?? acceptedRow)!.status as
                  | "pending"
                  | "accepted",
              }
            : null
        }
        initial={loyaltyInitial}
      />
    </main>
  );
}
