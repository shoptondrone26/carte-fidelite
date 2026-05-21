"use client";

import {
  computeShopPaymentTotals,
  formatPscFeePercentLabel,
  shopPaymentMethodLabelFr,
  type ShopPaymentMethod,
} from "@/lib/boutique/payment";
import { formatShopPrice } from "@/lib/boutique/products";
import { cn } from "@/lib/utils";

type ShopPaymentSelectorProps = {
  subtotalEur: number;
  paymentMethod: ShopPaymentMethod;
  paysafecardAmountEur: string;
  onPaymentMethodChange: (method: ShopPaymentMethod) => void;
  onPaysafecardAmountChange: (value: string) => void;
  disabled?: boolean;
};

export function ShopPaymentSelector({
  subtotalEur,
  paymentMethod,
  paysafecardAmountEur,
  onPaymentMethodChange,
  onPaysafecardAmountChange,
  disabled = false,
}: ShopPaymentSelectorProps) {
  const totals = computeShopPaymentTotals(
    subtotalEur,
    "chronopost_24h",
    paymentMethod,
    parsePaysafecardInput(paysafecardAmountEur),
  );

  const feePercent = formatPscFeePercentLabel();

  return (
    <div className="space-y-3 rounded-xl border border-amber-200/12 bg-linear-to-br from-amber-500/[0.04] to-black/40 p-3 animate-in fade-in duration-300">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/75">
        Mode de paiement
      </p>

      <div className="space-y-1.5">
        {(
          [
            {
              id: "wire_transfer" as const,
              hint: "0% de frais",
            },
            {
              id: "paysafecard" as const,
              hint: `Frais Paysafecard ${feePercent} sur le total`,
            },
            {
              id: "mixed" as const,
              hint: `Frais ${feePercent} sur le montant Paysafecard`,
            },
          ] as const
        ).map((opt) => (
          <label
            key={opt.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition duration-200",
              paymentMethod === opt.id
                ? "border-amber-300/40 bg-amber-300/10"
                : "border-white/10 bg-black/25 hover:border-white/15",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            <input
              type="radio"
              name="shop-payment-method"
              checked={paymentMethod === opt.id}
              onChange={() => onPaymentMethodChange(opt.id)}
              disabled={disabled}
              className="size-4 accent-amber-400"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-white">
                {shopPaymentMethodLabelFr[opt.id]}
              </span>
              <span className="text-[11px] text-zinc-500">{opt.hint}</span>
            </span>
          </label>
        ))}
      </div>

      {paymentMethod === "mixed" ? (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <label className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Montant Paysafecard (€)
          </label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={subtotalEur}
            step="0.01"
            disabled={disabled}
            value={paysafecardAmountEur}
            onChange={(e) => onPaysafecardAmountChange(e.target.value)}
            placeholder="Ex. 400"
            className="h-11 w-full rounded-xl border border-white/12 bg-black/40 px-3 text-sm tabular-nums text-white outline-none ring-amber-400/30 focus:ring-2"
          />
          <p className="text-[10px] text-zinc-500">
            Maximum {formatShopPrice(subtotalEur)} en Paysafecard (sous-total
            produits)
          </p>
        </div>
      ) : null}

      <PaymentFeeBreakdown totals={totals} />
    </div>
  );
}

export function PaymentFeeBreakdown({
  totals,
  className,
  compact,
}: {
  totals: ReturnType<typeof computeShopPaymentTotals>;
  className?: string;
  compact?: boolean;
}) {
  const feePercent = formatPscFeePercentLabel();
  const showWireNoFee =
    totals.paymentMethod === "wire_transfer" && totals.paymentFeeEur === 0;

  return (
    <div
      className={cn(
        "space-y-2 text-sm transition-all duration-300",
        !compact && "border-t border-white/8 pt-2.5",
        className,
      )}
    >
      <div className="flex justify-between gap-2 text-zinc-400">
        <span>Sous-total produits</span>
        <span className="tabular-nums">{formatShopPrice(totals.subtotalEur)}</span>
      </div>

      {totals.paymentFeeEur > 0 ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-400/25 bg-amber-500/12 px-2.5 py-2">
          <span className="text-sm font-medium leading-snug text-amber-50">
            {totals.paymentMethod === "mixed"
              ? `Frais Paysafecard ${feePercent} sur ${formatShopPrice(totals.pscAmountEur)}`
              : `Frais Paysafecard ${feePercent}`}
          </span>
          <span className="shrink-0 text-base font-semibold tabular-nums text-amber-100">
            +{formatShopPrice(totals.paymentFeeEur)}
          </span>
        </div>
      ) : showWireNoFee ? (
        <p className="text-[11px] text-emerald-200/70">0% de frais</p>
      ) : null}

      <div className="flex justify-between gap-2 pt-0.5 font-semibold text-amber-50">
        <span>Total à payer</span>
        <span className="tabular-nums text-base">
          {formatShopPrice(totals.finalTotalEur)}
        </span>
      </div>
    </div>
  );
}

function parsePaysafecardInput(value: string): number {
  const n = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
