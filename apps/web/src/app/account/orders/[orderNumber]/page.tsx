import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getOrder } from '@oasisa2/api';
import { getCurrentUser } from '@/lib/session';
import { butcherSummary, formatCents, formatSlot, orderStatusLabel } from '@/lib/format';

export const metadata: Metadata = { title: 'Order details', robots: { index: false } };

type Props = { params: Promise<{ orderNumber: string }> };

export default async function OrderDetailPage({ params }: Props) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/account/login');
  const order = await getOrder(orderNumber, user.id);
  if (!order) notFound();

  return (
    <div>
      <Link href="/account/orders" className="text-sm text-forest-700 hover:underline">
        ← All orders
      </Link>
      <h1 className="mt-2 text-2xl font-black text-charcoal-900">Order {order.orderNumber}</h1>
      <p className="mt-1 text-sm text-charcoal-700/70">
        {order.store.shortName} · {order.fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Pickup'}
        {order.slot
          ? ` · ${formatSlot(order.slot.date.toISOString().slice(0, 10), order.slot.startTime, order.slot.endTime)}`
          : ''}
      </p>

      <div className="mt-4 grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="card p-5">
          <ul className="divide-y divide-charcoal-700/10">
            {order.items.map((i) => (
              <li key={i.id} className="py-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-charcoal-900">{i.nameSnapshot}</span>
                  <span className="font-semibold">
                    {formatCents(i.finalLineCents ?? i.estimatedLineCents)}
                  </span>
                </div>
                <p className="text-xs text-charcoal-700/60">
                  {i.unitType === 'WEIGHT'
                    ? `Est ~${Number(i.requestedWeightLb ?? 0)} lb${
                        i.actualWeightLb ? ` · actual ${Number(i.actualWeightLb)} lb` : ''
                      } @ ${formatCents(i.unitPriceCents)}/lb`
                    : `${formatCents(i.unitPriceCents)} × ${i.quantity}`}
                  {' · '}
                  {orderStatusLabel(i.status)}
                </p>
                {i.butcherInstruction && (
                  <p className="text-xs text-forest-700">
                    Butcher: {butcherSummary(i.butcherInstruction.selections)}
                    {i.butcherInstruction.notes ? ` — “${i.butcherInstruction.notes}”` : ''}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="card p-4 text-sm">
            <Row label="Subtotal" value={formatCents(order.subtotalCents)} />
            {order.discountCents > 0 && (
              <Row label="Discounts" value={`−${formatCents(order.discountCents)}`} />
            )}
            {order.deliveryFeeCents > 0 && (
              <Row label="Delivery" value={formatCents(order.deliveryFeeCents)} />
            )}
            <Row label="Tax" value={formatCents(order.taxCents)} />
            {order.tipCents > 0 && <Row label="Tip" value={formatCents(order.tipCents)} />}
            <div className="mt-2 border-t border-charcoal-700/10 pt-2">
              <Row
                label={order.finalTotalCents ? 'Total charged' : 'Estimated total'}
                value={formatCents(order.finalTotalCents ?? order.estimatedTotalCents)}
                bold
              />
            </div>
          </div>

          <div className="card p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-charcoal-700/60">
              Status history
            </h2>
            <ol className="mt-2 space-y-1 text-sm">
              {order.statusHistory.map((h) => (
                <li key={h.id} className="flex justify-between">
                  <span>{orderStatusLabel(h.status)}</span>
                  <span className="text-charcoal-700/50">
                    {new Date(h.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
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
