import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdvantagesLive } from "@/components/client/advantages-live";
import type { ClientLoyaltySnapshot } from "@/lib/realtime/client-loyalty";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Avantages",
};

export default async function CartePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/carte");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("total_unlocks")
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

  const initial: ClientLoyaltySnapshot = {
    totalUnlocks: profile?.total_unlocks ?? 0,
    historyItems: historyRows ?? [],
    freeUsedHistory: freeUsedHistory ?? [],
    freeUsedCount: freeUsedCount ?? 0,
  };

  return (
    <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 overflow-hidden px-5 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div
        aria-hidden
        className="premium-ambient pointer-events-none absolute inset-x-10 top-14 h-44 rounded-full bg-amber-300/10 blur-3xl"
      />

      <header className="relative space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-200/80">
          Espace membre
        </p>
        <h1 className="text-4xl font-semibold tracking-tighter text-white">
          Avantages
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
          Votre progression, vos accès actifs et les récompenses déjà
          débloquées dans ShopTonDrone Privé.
        </p>
      </header>

      <AdvantagesLive userId={user.id} initial={initial} />
    </main>
  );
}
