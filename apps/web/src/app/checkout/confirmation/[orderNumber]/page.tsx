import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { getOrder } from '@oasisa2/api';
import { getSessionUserId } from '@/lib/session';
import { formatCents, formatSlot, orderStatusLabel } from '@/lib/format';

export const metadata: Metadata = { title: 'Order confirmed', robots: { index: false } };

type Props = { params: Promise<{ orderNumber: string }> };

export default async function ConfirmationPage({ params }: Props) {
  const { orderNumber } = await params;
  const userId = await getSessionUserId();
  const order = await getOrder(orderNumber, userId);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-forest-600" />
        <h1 className="mt-3 text-2xl font-black text-charcoal-900">Order received</h1>
        <p className="mt-1 text-sm text-charcoal-700/70">
          Order <span className="font-mono font-bold">{order.orderNumber}</span> ·{' '}
          {orderStatusLabel(order.status)}
        </p>
        <p className="mt-1 text-sm text-charcoal-700/70">
          We&apos;ll {order.fulfillmentType === 'DELIVERY' ? 'deliver from' : 'have it ready at'}{' '}
          {order.store.shortName}
          {order.slot
            ? ` — ${formatSlot(order.slot.date.toISOString().slice(0, 10), order.slot.startTime, order.slot.endTime)}`
            : ''}
          .
        </p>
      </div>

      <div className="card mt-4 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-charcoal-700/60">Items</h2>
        <ul className="mt-2 divide-y divide-charcoal-700/10">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between py-2 text-sm">
              <span>
                {i.nameSnapshot}
                <span className="text-charcoal-700/50">
                  {' '}
                  ·{' '}
                  {i.unitType === 'WEIGHT'
                    ? `~${Number(i.requestedWeightLb ?? 0)} lb`
                    : `×${i.quantity}`}
                </span>
              </span>
              <span className="font-semibold">
                {formatCents(i.finalLineCents ?? i.estimatedLineCents)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-charcoal-700/10 pt-3 text-sm">
          <Row label="Subtotal" value={formatCents(order.subtotalCents)} />
          {order.discountCents > 0 && (
            <Row label="Discounts" value={`−${formatCents(order.discountCents)}`} />
          )}
          {order.deliveryFeeCents > 0 && (
            <Row label="Delivery fee" value={formatCents(order.deliveryFeeCents)} />
          )}
          <Row label="Tax" value={formatCents(order.taxCents)} />
          {order.tipCents > 0 && <Row label="Tip" value={formatCents(order.tipCents)} />}
          <Row
            label={order.finalTotalCents ? 'Total' : 'Estimated total'}
            value={formatCents(order.finalTotalCents ?? order.estimatedTotalCents)}
            bold
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link href="/" className="btn-secondary flex-1">
          Back to home
        </Link>
        <Link href="/account/orders" className="btn-primary flex-1">
          View my orders
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-bold text-charcoal-900' : 'text-charcoal-700/70'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
