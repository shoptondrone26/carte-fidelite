import type { Metadata } from "next";

import { AdminPushSettings } from "@/components/admin/admin-push-settings";
import { isOneSignalClientEnabled, isOneSignalSendEnabled } from "@/lib/onesignal/config";
import { requireAdmin } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paramètres",
};

export default async function AdminSettingsPage() {
  const { user, supabase } = await requireAdmin("/admin/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("push_enabled, onesignal_subscription_id")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Notifications et tests OneSignal.
        </p>
      </header>

      <AdminPushSettings
        pushEnabled={profile?.push_enabled !== false}
        hasSubscriptionId={Boolean(
          profile?.onesignal_subscription_id?.trim(),
        )}
        sendConfigured={isOneSignalSendEnabled()}
      />

      {!isOneSignalClientEnabled() ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
          Définissez{" "}
          <code className="rounded bg-black/30 px-1">
            NEXT_PUBLIC_ONESIGNAL_APP_ID
          </code>{" "}
          et{" "}
          <code className="rounded bg-black/30 px-1">
            ONESIGNAL_REST_API_KEY
          </code>{" "}
          sur Vercel puis redéployez.
        </p>
      ) : null}
    </div>
  );
}
