"use client";

import { useState, useTransition } from "react";
import { Bell, BellRing } from "lucide-react";
import { toast } from "sonner";

import {
  sendTestPushToAllAdminsAction,
  sendTestPushToSelfAction,
} from "@/actions/push-test";
import {
  setPushEnabledAction,
  syncPushSubscriptionAction,
} from "@/actions/push-preferences";
import { isOneSignalClientEnabled } from "@/lib/onesignal/config";
import { pollAndSyncPushSubscription } from "@/lib/onesignal/subscription-sync";
import { cn } from "@/lib/utils";

type AdminPushSettingsProps = {
  pushEnabled: boolean;
  hasSubscriptionId: boolean;
  sendConfigured: boolean;
};

export function AdminPushSettings({
  pushEnabled,
  hasSubscriptionId,
  sendConfigured,
}: AdminPushSettingsProps) {
  const [pending, start] = useTransition();
  const [enabled, setEnabled] = useState(pushEnabled);

  const sdkReady = isOneSignalClientEnabled();

  const onEnablePush = () => {
    if (!sdkReady) {
      toast.error("App ID OneSignal manquant sur ce déploiement.");
      return;
    }
    start(async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          window.OneSignalDeferred = window.OneSignalDeferred ?? [];
          window.OneSignalDeferred.push(async (OneSignal) => {
            try {
              await OneSignal.Notifications.requestPermission();
              await OneSignal.User.PushSubscription.optIn();
              const subId = OneSignal.User.PushSubscription.id;
              if (subId) {
                await syncPushSubscriptionAction(subId);
              } else {
                await pollAndSyncPushSubscription(syncPushSubscriptionAction);
              }
              resolve();
            } catch (e) {
              reject(e);
            }
          });
        });
        const res = await setPushEnabledAction(true);
        if (res.ok) {
          setEnabled(true);
          toast.success("Notifications activées sur cet appareil");
        } else {
          toast.error(res.error);
        }
      } catch {
        toast.error("Permission refusée ou indisponible");
      }
    });
  };

  const onTestSelf = () => {
    start(async () => {
      const res = await sendTestPushToSelfAction();
      if (res.ok) toast.success(res.detail ?? "Notification test envoyée");
      else toast.error(res.error);
    });
  };

  const onTestAllAdmins = () => {
    start(async () => {
      const res = await sendTestPushToAllAdminsAction();
      if (res.ok) toast.success(res.detail ?? "Diffusion envoyée");
      else toast.error(res.error);
    });
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 size-5 shrink-0 text-amber-300/90" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-foreground">
              Notifications push (OneSignal)
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Infrastructure de test — pas encore de notifications métier
              automatiques supplémentaires.
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
          <li>
            SDK client :{" "}
            <span className={sdkReady ? "text-emerald-300" : "text-rose-300"}>
              {sdkReady ? "configuré" : "App ID manquant"}
            </span>
          </li>
          <li>
            Envoi serveur :{" "}
            <span
              className={sendConfigured ? "text-emerald-300" : "text-rose-300"}
            >
              {sendConfigured ? "prêt" : "clé REST manquante"}
            </span>
          </li>
          <li>
            Abonnement enregistré :{" "}
            <span
              className={
                hasSubscriptionId ? "text-emerald-300" : "text-amber-200"
              }
            >
              {hasSubscriptionId ? "oui" : "non — activez sur cet appareil"}
            </span>
          </li>
          <li>
            Préférence profil :{" "}
            <span className={enabled ? "text-emerald-300" : "text-zinc-400"}>
              {enabled ? "activées" : "désactivées"}
            </span>
          </li>
        </ul>

        {!enabled || !hasSubscriptionId ? (
          <button
            type="button"
            disabled={pending || !sdkReady}
            onClick={onEnablePush}
            className="mt-4 min-h-11 rounded-full bg-amber-500/20 px-4 py-2.5 text-xs font-semibold text-amber-50 ring-1 ring-amber-400/30 disabled:opacity-40"
          >
            Activer les notifications sur cet appareil
          </button>
        ) : null}
      </div>

      <div className="rounded-2xl border border-sky-500/25 bg-sky-500/5 p-4">
        <div className="flex items-start gap-3">
          <BellRing
            className="mt-0.5 size-5 shrink-0 text-sky-300"
            aria-hidden
          />
          <div>
            <h3 className="text-sm font-semibold text-sky-50">
              Tests manuels
            </h3>
            <p className="mt-1 text-xs text-sky-100/70">
              Une notification toutes les 60 s max. par bouton. Installez la PWA
              sur iPhone pour des résultats fiables.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending || !sendConfigured}
            onClick={onTestSelf}
            className={cn(
              "min-h-11 rounded-full px-4 py-2.5 text-xs font-semibold",
              "bg-sky-500/25 text-sky-50 ring-1 ring-sky-400/40",
              "disabled:opacity-40",
            )}
          >
            Envoyer notification test
          </button>
          <button
            type="button"
            disabled={pending || !sendConfigured}
            onClick={onTestAllAdmins}
            className={cn(
              "min-h-11 rounded-full border border-sky-500/30 px-4 py-2.5 text-xs font-semibold",
              "text-sky-100 disabled:opacity-40",
            )}
          >
            Tester tous les admins
          </button>
        </div>
      </div>
    </section>
  );
}
