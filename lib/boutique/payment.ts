/** Frais Paysafecard : 5 % sur la part Paysafecard (total ou montant mixte). */
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
 * Calcule les frais Paysafecard pour une commande Chronopost.
 * Remise en main propre : aucun frais, virement implicite.
 */
export function computeShopPaymentTotals(
  subtotalEur: number,
  deliveryMethod: "pickup" | "chronopost_24h",
  paymentMethod: ShopPaymentMethod,
  rawPaysafecardAmountEur?: number,
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

  if (paymentMethod === "wire_transfer") {
    return {
      subtotalEur: subtotal,
      paymentMethod: "wire_transfer",
      pscAmountEur: 0,
      paymentFeeEur: 0,
      finalTotalEur: subtotal,
    };
  }

  if (paymentMethod === "paysafecard") {
    const fee = roundMoneyEur(subtotal * PSC_FEE_RATE);
    return {
      subtotalEur: subtotal,
      paymentMethod: "paysafecard",
      pscAmountEur: subtotal,
      paymentFeeEur: fee,
      finalTotalEur: roundMoneyEur(subtotal + fee),
    };
  }

  const paysafecardAmount = roundMoneyEur(
    Math.max(0, rawPaysafecardAmountEur ?? 0),
  );

  if (paysafecardAmount <= 0) {
    return {
      subtotalEur: subtotal,
      paymentMethod: "wire_transfer",
      pscAmountEur: 0,
      paymentFeeEur: 0,
      finalTotalEur: subtotal,
    };
  }

  const capped = roundMoneyEur(Math.min(paysafecardAmount, subtotal));
  const fee = roundMoneyEur(capped * PSC_FEE_RATE);
  return {
    subtotalEur: subtotal,
    paymentMethod: "mixed",
    pscAmountEur: capped,
    paymentFeeEur: fee,
    finalTotalEur: roundMoneyEur(subtotal + fee),
  };
}

export function formatPscFeePercentLabel(): string {
  return `${Math.round(PSC_FEE_RATE * 100)}%`;
}
