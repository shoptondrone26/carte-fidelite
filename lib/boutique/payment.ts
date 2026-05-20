/** Frais Paysafecard : 5 % sur la part PSC (total ou montant mixte). */
export const PSC_FEE_RATE = 0.05;

export type ShopPaymentMethod = "wire_transfer" | "paysafecard" | "mixed";

export type ShopPaymentTotals = {
  subtotalEur: number;
  paymentMethod: ShopPaymentMethod;
  pscAmountEur: number;
  paymentFeeEur: number;
  finalTotalEur: number;
};

export const shopPaymentMethodLabelFr: Record<ShopPaymentMethod, string> = {
  wire_transfer: "Virement",
  paysafecard: "Paysafecard",
  mixed: "Mixte",
};

export function roundMoneyEur(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calcule les frais PSC pour une commande Chronopost.
 * Remise en main propre : aucun frais, virement implicite.
 */
export function computeShopPaymentTotals(
  subtotalEur: number,
  deliveryMethod: "pickup" | "chronopost_24h",
  paymentMethod: ShopPaymentMethod,
  rawPscAmountEur?: number,
): ShopPaymentTotals {
  const subtotal = roundMoneyEur(Math.max(0, subtotalEur));

  if (deliveryMethod === "pickup") {
    return {
      subtotalEur: subtotal,
      paymentMethod: "wire_transfer",
      pscAmountEur: 0,
      paymentFeeEur: 0,
      finalTotalEur: subtotal,
    };
  }

  const pscInput = roundMoneyEur(Math.max(0, rawPscAmountEur ?? 0));

  if (paymentMethod === "wire_transfer" || pscInput <= 0) {
    return {
      subtotalEur: subtotal,
      paymentMethod: "wire_transfer",
      pscAmountEur: 0,
      paymentFeeEur: 0,
      finalTotalEur: subtotal,
    };
  }

  if (paymentMethod === "paysafecard" || pscInput >= subtotal) {
    const fee = roundMoneyEur(subtotal * PSC_FEE_RATE);
    return {
      subtotalEur: subtotal,
      paymentMethod: "paysafecard",
      pscAmountEur: subtotal,
      paymentFeeEur: fee,
      finalTotalEur: roundMoneyEur(subtotal + fee),
    };
  }

  const pscAmount = roundMoneyEur(Math.min(pscInput, subtotal));
  const fee = roundMoneyEur(pscAmount * PSC_FEE_RATE);
  return {
    subtotalEur: subtotal,
    paymentMethod: "mixed",
    pscAmountEur: pscAmount,
    paymentFeeEur: fee,
    finalTotalEur: roundMoneyEur(subtotal + fee),
  };
}

export function formatPscFeePercentLabel(): string {
  return `${Math.round(PSC_FEE_RATE * 100)}%`;
}
