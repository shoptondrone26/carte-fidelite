import { formatShopPrice } from "@/lib/boutique/products";
import {
  shopPaymentMethodLabelFr,
  type ShopOrder,
} from "@/lib/boutique/orders";
import { cn } from "@/lib/utils";

type ShopOrderPaymentDetailsProps = {
  order: ShopOrder;
  compact?: boolean;
  className?: string;
};

export function ShopOrderPaymentDetails({
  order,
  compact = false,
  className,
}: ShopOrderPaymentDetailsProps) {
  const showFees =
    order.delivery_method === "chronopost_24h" || order.payment_fee_eur > 0;

  if (!showFees && order.subtotal_eur === order.total_price_eur) {
    return null;
  }

  return (
    <div
      className={cn(
        "space-y-1 rounded-xl border border-white/8 bg-black/25 px-2.5 py-2",
        compact ? "text-[10px]" : "text-xs",
        className,
      )}
    >
      {order.subtotal_eur !== order.total_price_eur ||
      order.payment_fee_eur > 0 ? (
        <div className="flex justify-between gap-2 text-zinc-400">
          <span>Sous-total produits</span>
          <span className="tabular-nums">
            {formatShopPrice(order.subtotal_eur)}
          </span>
        </div>
      ) : null}

      {order.delivery_method === "chronopost_24h" ? (
        <div className="flex justify-between gap-2 text-zinc-300">
          <span>Paiement</span>
          <span>{shopPaymentMethodLabelFr[order.payment_method]}</span>
        </div>
      ) : null}

      {order.payment_method === "mixed" && order.psc_amount_eur > 0 ? (
        <div className="flex justify-between gap-2 text-zinc-400">
          <span>Montant Paysafecard</span>
          <span className="tabular-nums">
            {formatShopPrice(order.psc_amount_eur)}
          </span>
        </div>
      ) : null}

      {order.payment_fee_eur > 0 ? (
        <div className="flex justify-between gap-2 text-amber-100/85">
          <span>
            Frais Paysafecard
            {order.payment_method === "mixed"
              ? ` sur ${formatShopPrice(order.psc_amount_eur)}`
              : " 5%"}
          </span>
          <span className="tabular-nums">
            +{formatShopPrice(order.payment_fee_eur)}
          </span>
        </div>
      ) : order.delivery_method === "chronopost_24h" &&
        order.payment_method === "wire_transfer" ? (
        <p className="text-emerald-200/70">0% de frais</p>
      ) : null}

      <div
        className={cn(
          "flex justify-between gap-2 border-t border-white/8 pt-1 font-semibold text-amber-50",
          compact && "pt-0.5",
        )}
      >
        <span>Total payé</span>
        <span className="tabular-nums">
          {formatShopPrice(order.total_price_eur)}
        </span>
      </div>
    </div>
  );
}
