"use server";

import { revalidatePath } from "next/cache";

import {
  isPushTestRateLimited,
  markPushTestSent,
  sendDirectPushToAdmins,
  sendDirectPushToUser,
} from "@/lib/onesignal/direct-send";
import { isOneSignalSendEnabled } from "@/lib/onesignal/config";
import { getIsAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export type PushTestResult =
  | { ok: true; detail?: string }
  | { ok: false; error: string };

async function assertAuthenticated() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Connexion requise.", user: null, supabase };
  }
  return { ok: true as const, user, supabase };
}

function ensureSendReady(): PushTestResult | null {
  if (!isOneSignalSendEnabled()) {
    return {
      ok: false,
      error:
        "OneSignal non configuré (NEXT_PUBLIC_ONESIGNAL_APP_ID + ONESIGNAL_REST_API_KEY).",
    };
  }
  return null;
}

/** Test manuel — notification à l’utilisateur connecté (admin ou client). */
export async function sendTestPushToSelfAction(): Promise<PushTestResult> {
  const ready = ensureSendReady();
  if (ready) return ready;

  const auth = await assertAuthenticated();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (isPushTestRateLimited(auth.user.id)) {
    return {
      ok: false,
      error: "Attendez une minute avant un nouvel envoi test.",
    };
  }

  const isAdmin = await getIsAdmin(auth.supabase, auth.user.id);
  const result = await sendDirectPushToUser(auth.user.id, {
    title: isAdmin ? "Test admin · Carte" : "Test · Carte",
    body: isAdmin
      ? "Notification test depuis les paramètres admin."
      : "Notification test depuis votre espace membre.",
    url: isAdmin ? "/admin/settings" : "/dashboard",
  });

  if (!result.ok) {
    if (result.skipped) {
      return {
        ok: false,
        error:
          "Notifications désactivées sur votre profil. Activez-les ci-dessous puis réessayez.",
      };
    }
    return { ok: false, error: result.error ?? "Échec envoi OneSignal." };
  }

  markPushTestSent(auth.user.id);
  return { ok: true, detail: "Notification envoyée." };
}

/** Test manuel admin — diffusion à tous les comptes admin. */
export async function sendTestPushToAllAdminsAction(): Promise<PushTestResult> {
  const ready = ensureSendReady();
  if (ready) return ready;

  const auth = await assertAuthenticated();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!(await getIsAdmin(auth.supabase, auth.user.id))) {
    return { ok: false, error: "Accès admin requis." };
  }

  if (isPushTestRateLimited(`admins:${auth.user.id}`)) {
    return {
      ok: false,
      error: "Attendez une minute avant une nouvelle diffusion test.",
    };
  }

  const batch = await sendDirectPushToAdmins(
    {
      title: "Test admin · Carte",
      body: "Diffusion test à l’équipe admin.",
      url: "/admin/settings",
    },
    { excludeUserId: undefined },
  );

  markPushTestSent(`admins:${auth.user.id}`);

  if (batch.sent === 0) {
    return {
      ok: false,
      error:
        batch.errors[0] ??
        "Aucun admin n’a reçu la notification (push désactivé ou non abonné).",
    };
  }

  revalidatePath("/admin/settings");
  return {
    ok: true,
    detail: `${batch.sent} admin(s) notifié(s)${batch.failed ? `, ${batch.failed} échec(s)` : ""}.`,
  };
}
