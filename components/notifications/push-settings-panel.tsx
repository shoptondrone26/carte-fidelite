"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  setPushEnabledAction,
  syncPushSubscriptionAction,
} from "@/actions/push-preferences";
import { isOneSignalClientEnabled } from "@/lib/onesignal/config";
import {
  pollAndSyncPushSubscription,
  runOneSignalTask,
} from "@/lib/onesignal/subscription-sync";
import {
  hasPublicOneSignalAppId,
  isPushDebugUiEnabled,
  publicOneSignalAppIdLength,
  pushDebugLog,
} from "@/lib/push-debug";
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

type DebugSnap = {
  appIdPresent: boolean;
  appIdLen: number;
  sdkScriptLikely: boolean;
  oneSignalGlobal: boolean;
  permission: string;
  pushSubId: string | null;
  onesignalUserId: string | null;
  optedIn: boolean | null;
};

export function PushSettingsPanel({ initialEnabled }: PushSettingsPanelProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [permission, setPermission] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [debugUi, setDebugUi] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [debugSnap, setDebugSnap] = useState<DebugSnap | null>(null);

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

  useEffect(() => {
    setDebugUi(isPushDebugUiEnabled());
  }, []);

  const refreshDebugSnap = useCallback(() => {
    if (!debugUi) return;
    const baseSnap: DebugSnap = {
      appIdPresent: hasPublicOneSignalAppId(),
      appIdLen: publicOneSignalAppIdLength(),
      sdkScriptLikely:
        typeof document !== "undefined" &&
        Boolean(
          document.querySelector('script[src*="OneSignalSDK.page"]'),
        ),
      oneSignalGlobal: typeof window !== "undefined" && !!window.OneSignal,
      permission:
        typeof window !== "undefined" && "Notification" in window
          ? Notification.permission
          : "no-notification-api",
      pushSubId: null,
      onesignalUserId: null,
      optedIn: null,
    };
    setDebugSnap(baseSnap);
    if (!sdkReady) {
      return;
    }
    void runOneSignalTask(async (OneSignal) => {
      const userExtras = OneSignal.User as unknown as {
        onesignalId?: string | null;
      };
      setDebugSnap({
        ...baseSnap,
        sdkScriptLikely:
          typeof document !== "undefined" &&
          Boolean(
            document.querySelector(
              'script[src*="OneSignalSDK.page"]',
            ),
          ),
        oneSignalGlobal: typeof window !== "undefined" && !!window.OneSignal,
        permission:
          "Notification" in window
            ? Notification.permission
            : "no-notification-api",
        pushSubId: OneSignal.User.PushSubscription.id ?? null,
        onesignalUserId: userExtras.onesignalId ?? null,
        optedIn:
          typeof OneSignal.User.PushSubscription.optedIn === "boolean"
            ? OneSignal.User.PushSubscription.optedIn
            : null,
      });
    });
  }, [debugUi, sdkReady]);

  useEffect(() => {
    if (!debugUi) return;
    refreshDebugSnap();
    const t = window.setInterval(refreshDebugSnap, 1500);
    return () => window.clearInterval(t);
  }, [debugUi, refreshDebugSnap]);

  const onEnable = () => {
    if (!sdkReady) {
      toast.error("Notifications non configurées sur ce déploiement.");
      return;
    }

    start(async () => {
      setLastError(null);
      try {
        window.OneSignalDeferred = window.OneSignalDeferred ?? [];
        await new Promise<void>((resolve, reject) => {
          window.OneSignalDeferred!.push(async (OneSignal) => {
            try {
              pushDebugLog("optIn: requestPermission + optIn");
              if (isIos() && !isStandalonePwa()) {
                toast.message("Installez l’app sur l’écran d’accueil", {
                  description:
                    "Sur iPhone, les notifications web fonctionnent surtout en mode application installée.",
                });
              }
              await OneSignal.Notifications.requestPermission();
              await OneSignal.User.PushSubscription.optIn();
              const subId = OneSignal.User.PushSubscription.id;
              pushDebugLog("push subscription id (juste après optIn)", subId);
              if (subId) {
                const syncRes = await syncPushSubscriptionAction(subId);
                pushDebugLog("sync Supabase", syncRes);
                if (!syncRes.ok) setLastError(syncRes.error ?? "sync failed");
              } else {
                const polled = await pollAndSyncPushSubscription(
                  async (id) => {
                    const r = await syncPushSubscriptionAction(id);
                    pushDebugLog("sync Supabase (poll)", id, r);
                    if (!r.ok) setLastError(r.error ?? "sync failed");
                    return r;
                  },
                  { maxAttempts: 60, delayMs: 300 },
                );
                pushDebugLog("poll subscription id final", polled);
                if (!polled) {
                  setLastError(
                    "Pas d’ID d’abonnement OneSignal après optIn (timeout poll).",
                  );
                }
              }
              resolve();
            } catch (e) {
              const msg =
                e instanceof Error ? e.message : String(e);
              pushDebugLog("optIn erreur", e);
              setLastError(msg);
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
          setLastError(res.error ?? "setPushEnabled failed");
          toast.error(res.error ?? "Erreur");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setLastError((prev) => prev ?? msg);
        refreshPermission();
        toast.error("Permission refusée ou indisponible", {
          description: msg,
        });
      }
    });
  };

  const onDisable = () => {
    start(async () => {
      setLastError(null);
      window.OneSignalDeferred = window.OneSignalDeferred ?? [];
      await new Promise<void>((resolve) => {
        window.OneSignalDeferred!.push(async (OneSignal) => {
          pushDebugLog("optOut");
          await OneSignal.User.PushSubscription.optOut();
          resolve();
        });
      });

      const res = await setPushEnabledAction(false);
      if (res.ok) {
        setEnabled(false);
        toast.success("Notifications désactivées");
      } else {
        setLastError(res.error ?? "setPushEnabled false failed");
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
        {debugUi ? (
          <PushDebugBlock
            snap={
              debugSnap ?? {
                appIdPresent: false,
                appIdLen: 0,
                sdkScriptLikely: false,
                oneSignalGlobal: false,
                permission: permission ?? "—",
                pushSubId: null,
                onesignalUserId: null,
                optedIn: null,
              }
            }
            lastError={lastError}
            note="Définir NEXT_PUBLIC_ONESIGNAL_APP_ID puis redéployer."
          />
        ) : null}
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

      {lastError ? (
        <p className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 font-mono text-[11px] text-rose-100">
          {lastError}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || enabled}
          onClick={onEnable}
          className="min-h-12 min-w-40 rounded-full bg-amber-500/20 px-4 py-3 text-xs font-semibold text-amber-50 ring-1 ring-amber-400/30 disabled:opacity-40 active:scale-[0.98]"
        >
          Activer les notifications
        </button>
        <button
          type="button"
          disabled={pending || !enabled}
          onClick={onDisable}
          className="min-h-12 rounded-full border border-border/60 px-4 py-3 text-xs font-semibold text-muted-foreground disabled:opacity-40 active:scale-[0.98]"
        >
          Désactiver
        </button>
      </div>

      {debugUi && debugSnap ? (
        <PushDebugBlock snap={debugSnap} lastError={lastError} />
      ) : null}

      {debugUi ? (
        <p className="mt-2 text-[10px] text-muted-foreground">
          Debug : actif via{" "}
          <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_PUSH_DEBUG=1</code>.
          Les raccourcis URL/localStorage sont réservés au développement.
        </p>
      ) : null}
    </section>
  );
}

function PushDebugBlock({
  snap,
  lastError,
  note,
}: {
  snap: DebugSnap;
  lastError: string | null;
  note?: string;
}) {
  return (
    <div className="mt-4 space-y-1 rounded-xl border border-amber-500/30 bg-black/30 p-3 font-mono text-[10px] leading-relaxed text-zinc-300">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">
        Diagnostic push (temporaire)
      </p>
      {note ? <p className="text-amber-100/80">{note}</p> : null}
      <p>NEXT_PUBLIC_ONESIGNAL_APP_ID : {snap.appIdPresent ? `oui (longueur ${snap.appIdLen})` : "non"}</p>
      <p>Script OneSignal dans le DOM : {snap.sdkScriptLikely ? "oui" : "non"}</p>
      <p>window.OneSignal (instance page) : {snap.oneSignalGlobal ? "oui" : "non"}</p>
      <p>Permission navigateur : {snap.permission}</p>
      <p>PushSubscription.id : {snap.pushSubId ?? "null"}</p>
      <p>User.onesignalId : {snap.onesignalUserId ?? "non dispo / null"}</p>
      <p>PushSubscription.optedIn : {snap.optedIn === null ? "inconnu" : String(snap.optedIn)}</p>
      {lastError ? (
        <p className="text-rose-300">Dernière erreur : {lastError}</p>
      ) : null}
    </div>
  );
}
