import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardLive } from "@/components/client/dashboard-live";
import { ClientNotificationActivationPrompt } from "@/components/notifications/client-notification-activation-prompt";
import { isClientPushSubscribed } from "@/lib/push/client-subscription";
import { getIsAdmin } from "@/lib/auth/roles";
import { fetchClientPhantomRequest } from "@/lib/phantom/requests";
import type { ClientLoyaltySnapshot } from "@/lib/realtime/client-loyalty";
import { createClient } from "@/lib/supabase/server";

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
    .select(
      "id, email, full_name, phone, created_at, total_unlocks, push_enabled, onesignal_subscription_id",
    )
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

  const nowIso = new Date().toISOString();

  const { data: pendingBooking } = await supabase
    .from("bookings")
    .select("id, created_at, starts_at, status")
    .eq("profile_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  const { data: acceptedBooking } = pendingBooking
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

  const { data: latestBooking } =
    pendingBooking || acceptedBooking
      ? { data: null }
      : await supabase
          .from("bookings")
          .select("id, created_at, starts_at, status")
          .eq("profile_id", user.id)
          .in("status", ["accepted", "refused", "cancelled"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

  const booking = pendingBooking ?? acceptedBooking ?? latestBooking;

  const [{ count: freeUsedCount }, phantomRequest] = await Promise.all([
    supabase
      .from("history")
      .select("id", { count: "exact", head: true })
      .eq("subject_id", user.id)
      .eq("event_type", "free_used"),
    fetchClientPhantomRequest(supabase, user.id),
  ]);

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
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 overflow-x-hidden px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
      {error ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </p>
      ) : null}

      {profile ? (
        <>
          <ClientNotificationActivationPrompt
            initialSubscribed={isClientPushSubscribed(profile)}
          />
          <DashboardLive
            userId={user.id}
            displayName={displayName}
            initial={loyaltyInitial}
            initialBooking={
              booking
                ? {
                    id: booking.id,
                    created_at: booking.created_at,
                    starts_at: booking.starts_at,
                    status: booking.status as
                      | "pending"
                      | "accepted"
                      | "refused"
                      | "cancelled",
                  }
                : null
            }
            initialPhantomRequest={phantomRequest}
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
