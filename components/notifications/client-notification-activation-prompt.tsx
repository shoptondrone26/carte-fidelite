"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, CheckCircle2, Smartphone } from "lucide-react";
import { toast } from "sonner";

import {
  activateClientPushNotifications,
  isIosDevice,
  isStandalonePwa,
  syncExistingClientPushSubscription,
} from "@/lib/onesignal/activate-client-push";
import { isOneSignalClientEnabled } from "@/lib/onesignal/config";
import { waitForOneSignalSdkReady } from "@/lib/onesignal/subscription-sync";
import { cn } from "@/lib/utils";

type ClientNotificationActivationPromptProps = {
  /** true = onesignal_subscription_id en base + push_enabled */
  initialSubscribed: boolean;
  className?: string;
};

export function ClientNotificationActivationPrompt({
  initialSubscribed,
  className,
}: ClientNotificationActivationPromptProps) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [isActivating, setIsActivating] = useState(false);
  const [iosNeedsPwa, setIosNeedsPwa] = useState(false);
  const [justActivated, setJustActivated] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [sdkPrepared, setSdkPrepared] = useState(false);
  const didTrySyncRef = useRef(false);

  const sdkReady = isOneSignalClientEnabled();

  useEffect(() => {
    setSubscribed(initialSubscribed);
  }, [initialSubscribed]);

  useEffect(() => {
    setIosNeedsPwa(isIosDevice() && !isStandalonePwa());
  }, []);

  useEffect(() => {
    if (!sdkReady || iosNeedsPwa) {
      setSdkPrepared(false);
      return;
    }
    let cancelled = false;
    void waitForOneSignalSdkReady(25_000).then((ready) => {
      if (!cancelled) setSdkPrepared(ready);
    });
    return () => {
      cancelled = true;
    };
  }, [sdkReady, iosNeedsPwa]);

  useEffect(() => {
    if (subscribed || !sdkReady || didTrySyncRef.current) return;
    didTrySyncRef.current = true;
    void syncExistingClientPushSubscription().then((synced) => {
      if (synced) setSubscribed(true);
    });
  }, [subscribed, sdkReady]);

  if (subscribed && !justActivated) {
    return null;
  }

  if (subscribed && justActivated) {
    return (
      <section
        className={cn(
          "rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-4 shadow-inner shadow-emerald-950/20",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 size-5 shrink-0 text-emerald-300"
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold text-emerald-50">
              Notifications activées
            </p>
            <p className="mt-1 text-xs leading-relaxed text-emerald-100/80">
              Vous recevrez vos confirmations de réservation et vos alertes
              ShopTonDrone sur cet appareil.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!sdkReady) {
    return null;
  }

  const onActivate = async () => {
    if (isActivating) return;

    if (iosNeedsPwa) {
      toast.message("Installation requise", {
        description:
          "Ajoutez l’application à l’écran d’accueil pour activer les notifications.",
        duration: 8000,
      });
      return;
    }

    if (!sdkPrepared) {
      toast.message("Chargement des notifications…", {
        description: "Patientez une seconde puis réessayez.",
      });
      return;
    }

    setIsActivating(true);
    setLastError(null);

    try {
      const result = await activateClientPushNotifications();
      if (result.ok) {
        setSubscribed(true);
        setJustActivated(true);
        toast.success("Notifications activées", {
          description:
            "Vous serez prévenu des confirmations de réservation et de vos services premium.",
          duration: 6000,
        });
        return;
      }

      if (result.needsPwaInstall) {
        setIosNeedsPwa(true);
        setLastError(result.error);
        toast.message("Ajoutez l’application à l’écran d’accueil", {
          description: result.error,
          duration: 8000,
        });
        return;
      }

      setLastError(result.error);
      toast.error("Activation impossible", { description: result.error });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLastError(msg);
      toast.error("Activation impossible", { description: msg });
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-amber-400/35 bg-linear-to-br from-amber-500/15 via-zinc-900/80 to-zinc-950 p-5 shadow-lg shadow-amber-950/25 ring-1 ring-amber-300/15",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-amber-400/15 blur-2xl"
      />

      <div className="relative flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 ring-1 ring-amber-400/30">
          <BellRing className="size-5 text-amber-200" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/90">
            Recommandé
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-tight text-white">
            Activez les notifications ShopTonDrone
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            Recevez vos confirmations de réservation, commandes et services
            premium en temps réel.
          </p>
        </div>
      </div>

      {iosNeedsPwa ? (
        <div className="relative mt-4 flex gap-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-3 text-xs leading-relaxed text-sky-50/95">
          <Smartphone className="mt-0.5 size-4 shrink-0 text-sky-300" aria-hidden />
          <p>
            Ajoutez l’application à l’écran d’accueil pour activer les
            notifications.
          </p>
        </div>
      ) : null}

      {lastError ? (
        <p className="relative mt-3 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          {lastError}
        </p>
      ) : null}

      <button
        type="button"
        disabled={isActivating || (!iosNeedsPwa && !sdkPrepared)}
        onClick={() => void onActivate()}
        className={cn(
          "relative mt-4 flex w-full min-h-12 items-center justify-center gap-2 rounded-full",
          "bg-amber-400 px-4 py-3 text-sm font-bold text-zinc-950",
          "transition active:scale-[0.98] disabled:opacity-50",
          "shadow-md shadow-amber-900/40",
        )}
      >
        <Bell className="size-4" aria-hidden />
        {isActivating
          ? "Activation…"
          : !sdkPrepared && !iosNeedsPwa
            ? "Préparation…"
            : "Activer les notifications"}
      </button>
    </section>
  );
}
