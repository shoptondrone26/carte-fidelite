"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  formatEur,
  UNLOCK_AMOUNTS_EUR,
  type UnlockAmountEur,
} from "@/lib/admin/accounting";
import { cn } from "@/lib/utils";

type ValidateUnlockAmountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  busy?: boolean;
  onConfirm: (amount: UnlockAmountEur) => void;
};

export function ValidateUnlockAmountDialog({
  open,
  onOpenChange,
  clientName,
  busy = false,
  onConfirm,
}: ValidateUnlockAmountDialogProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-200 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="validate-unlock-title"
      onClick={() => !busy && onOpenChange(false)}
    >
      <div
        className="mx-auto w-full max-w-lg rounded-t-[1.75rem] border border-white/10 bg-zinc-950/95 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p
              id="validate-unlock-title"
              className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/90"
            >
              Déblocage validé
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              Montant pour{" "}
              <span className="font-medium text-white">{clientName}</span>
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => onOpenChange(false)}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 text-zinc-300 disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {UNLOCK_AMOUNTS_EUR.map((amount) => (
            <button
              key={amount}
              type="button"
              disabled={busy}
              onClick={() => onConfirm(amount)}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-16 flex-col gap-1 border-amber-500/30 bg-amber-500/10 text-amber-50 hover:bg-amber-500/20",
              )}
            >
              <span className="text-2xl font-semibold tabular-nums">
                {formatEur(amount)}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => onOpenChange(false)}
          className={cn(
            buttonVariants({ variant: "ghost", size: "lg" }),
            "mt-3 h-11 w-full text-zinc-400",
          )}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
