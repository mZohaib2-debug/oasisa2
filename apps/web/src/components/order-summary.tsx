import type { CartTotals } from '@oasisa2/commerce';
import { formatCents } from '@/lib/format';

export function OrderSummary({
  totals,
  fulfillmentType,
  children,
}: {
  totals: CartTotals;
  fulfillmentType: 'PICKUP' | 'DELIVERY';
  children?: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-charcoal-700/60">
        Order summary
      </h2>
      <dl className="mt-3 space-y-2 text-sm">
        <Line label={`Subtotal (${totals.itemCount} items)`} value={formatCents(totals.subtotalGrossCents)} />
        {totals.discountCents > 0 && (
          <Line label="Discounts" value={`−${formatCents(totals.discountCents)}`} accent />
        )}
        {fulfillmentType === 'DELIVERY' && (
          <Line
            label="Delivery fee"
            value={totals.deliveryFeeCents === 0 ? 'Free' : formatCents(totals.deliveryFeeCents)}
          />
        )}
        <Line label="Estimated tax" value={formatCents(totals.taxCents)} />
        {totals.tipCents > 0 && <Line label="Tip" value={formatCents(totals.tipCents)} />}
      </dl>
      <div className="mt-3 flex items-baseline justify-between border-t border-charcoal-700/10 pt-3">
        <span className="font-bold text-charcoal-900">
          {totals.hasEstimatedItems ? 'Estimated total' : 'Total'}
        </span>
        <span className="text-xl font-black text-charcoal-900">
          {formatCents(totals.estimatedTotalCents)}
        </span>
      </div>
      {totals.hasEstimatedItems && (
        <p className="mt-1 text-xs text-charcoal-700/60">
          Weighed items are estimated. Your final total is set from the actual prepared weight.
        </p>
      )}
      {totals.couponError && (
        <p className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">
          Coupon: {totals.couponError.replace(/_/g, ' ')}
        </p>
      )}
      {fulfillmentType === 'DELIVERY' && !totals.meetsDeliveryMinimum && (
        <p className="mt-2 rounded bg-gold-400/15 px-2 py-1 text-xs text-gold-600">
          Add {formatCents(totals.amountToMinimumCents)} more to meet the delivery minimum.
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

function Line({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-charcoal-700/70">{label}</dt>
      <dd className={accent ? 'font-semibold text-forest-700' : 'text-charcoal-900'}>{value}</dd>
    </div>
  );
}
