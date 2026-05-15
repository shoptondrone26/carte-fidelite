"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "carte:pwa-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isMobileUa(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

export function PwaClient() {
  const bipReceived = useRef(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  const dismissed = useMemo(() => {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (dismissed || isStandalone() || !isMobileUa()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      bipReceived.current = true;
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
      setIosHint(false);
    };

    window.addEventListener("beforeinstallprompt", onBip);

    const viewsKey = "carte:pwa-session-views";
    let views = 0;
    try {
      views = Number(sessionStorage.getItem(viewsKey) || "0") + 1;
      sessionStorage.setItem(viewsKey, String(views));
    } catch {
      views = 1;
    }

    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1);

    const t = window.setTimeout(() => {
      if (bipReceived.current || isStandalone()) return;
      if (isIos && views >= 2) {
        setIosHint(true);
        setVisible(true);
      }
    }, 1200);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.clearTimeout(t);
    };
  }, [dismissed]);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const installAndroid = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    dismiss();
    setDeferred(null);
  }, [deferred, dismiss]);

  if (!visible || dismissed || isStandalone()) return null;

  return (
    <div
      role="dialog"
      aria-label="Installer l’application"
      className={cn(
        "fixed inset-x-0 bottom-0 z-100 mx-auto max-w-lg px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
      )}
    >
      <div className="rounded-2xl border border-border/70 bg-card/95 p-4 shadow-2xl backdrop-blur-xl supports-backdrop-filter:bg-card/85">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Application
            </p>
            <p className="mt-1 text-sm font-medium leading-snug">
              {iosHint
                ? "Installez Carte sur votre écran d’accueil pour une expérience plein écran."
                : "Ajoutez Carte à votre écran d’accueil pour un accès rapide, comme une app native."}
            </p>
            {iosHint ? (
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
                <li>Appuyez sur le bouton Partager (carré avec flèche).</li>
                <li>Faites défiler et choisissez « Ajouter à l’écran d’accueil ».</li>
                <li>Validez « Ajouter » en haut à droite.</li>
              </ol>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={dismiss}>
              Plus tard
            </Button>
            {deferred && !iosHint ? (
              <Button type="button" size="sm" className="rounded-full" onClick={installAndroid}>
                Installer
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
