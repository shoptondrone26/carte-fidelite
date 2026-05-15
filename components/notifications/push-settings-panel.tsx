"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  setPushEnabledAction,
  syncPushSubscriptionAction,
} from "@/actions/push-preferences";
import { isOneSignalClientEnabled } from "@/lib/onesignal/config";
import { pollAndSyncPushSubscription } from "@/lib/onesignal/subscription-sync";
import { cn } from "@/lib/utils";

type PushSettingsPanelProps = {
  initialEnabled: boolean;
};

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1)
  );
}

function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

export function PushSettingsPanel({ initialEnabled }: PushSettingsPanelProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [permission, setPermission] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const sdkReady = isOneSignalClientEnabled();

  const refreshPermission = useCallback(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    refreshPermission();
  }, [refreshPermission]);

  const onEnable = () => {
    if (!sdkReady) {
      toast.error("Notifications non configurées sur ce déploiement.");
      return;
    }

    start(async () => {
      try {
        window.OneSignalDeferred = window.OneSignalDeferred ?? [];
        await new Promise<void>((resolve, reject) => {
          window.OneSignalDeferred!.push(async (OneSignal) => {
            try {
              if (isIos() && !isStandalonePwa()) {
                toast.message("Installez l’app sur l’écran d’accueil", {
                  description:
                    "Sur iPhone, les notifications web fonctionnent surtout en mode application installée.",
                });
              }
              await OneSignal.Notifications.requestPermission();
              await OneSignal.User.PushSubscription.optIn();
              const subId = OneSignal.User.PushSubscription.id;
              if (subId) await syncPushSubscriptionAction(subId);
              else {
                await pollAndSyncPushSubscription(
                  (id) => syncPushSubscriptionAction(id),
                  { maxAttempts: 60, delayMs: 300 },
                );
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
          refreshPermission();
          toast.success("Notifications activées");
        } else {
          toast.error(res.error ?? "Erreur");
        }
      } catch {
        refreshPermission();
        toast.error("Permission refusée ou indisponible");
      }
    });
  };

  const onDisable = () => {
    start(async () => {
      window.OneSignalDeferred = window.OneSignalDeferred ?? [];
      await new Promise<void>((resolve) => {
        window.OneSignalDeferred!.push(async (OneSignal) => {
          await OneSignal.User.PushSubscription.optOut();
          resolve();
        });
      });

      const res = await setPushEnabledAction(false);
      if (res.ok) {
        setEnabled(false);
        toast.success("Notifications désactivées");
      } else {
        toast.error(res.error ?? "Erreur");
      }
    });
  };

  if (!sdkReady) {
    return (
      <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
        <p className="text-sm font-medium">Notifications</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Non disponibles sur cet environnement (App ID manquant).
        </p>
      </section>
    );
  }

  const denied = permission === "denied";

  return (
    <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Notifications push</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Réservations, gratuits et niveau VIP — même app fermée.
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase",
            enabled
              ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30"
              : "bg-muted text-muted-foreground",
          )}
        >
          {enabled ? "Activées" : "Désactivées"}
        </span>
      </div>

      {denied ? (
        <p className="mt-3 text-xs text-amber-200/90">
          Permission bloquée dans le navigateur. Sur iPhone : Réglages →
          Notifications → Carte (après installation PWA).
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || enabled}
          onClick={onEnable}
          className="rounded-full bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-50 ring-1 ring-amber-400/30 disabled:opacity-40"
        >
          Activer
        </button>
        <button
          type="button"
          disabled={pending || !enabled}
          onClick={onDisable}
          className="rounded-full border border-border/60 px-4 py-2 text-xs font-semibold text-muted-foreground disabled:opacity-40"
        >
          Désactiver
        </button>
      </div>
    </section>
  );
}


