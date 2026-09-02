import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Printer } from 'lucide-react';
import { getOrderDetail } from '@/server/orders';
import { OrderStatusControls } from '@/components/order-status-controls';
import { Badge } from '@/components/stat-card';
import {
  butcherSummary,
  formatCents,
  formatDateTime,
  orderStatusTone,
  slotLabel,
  statusLabel,
} from '@/lib/format';

type Props = { params: Promise<{ orderNumber: string }> };

export default async function OrderDetailPage({ params }: Props) {
  const { orderNumber } = await params;
  const order = await getOrderDetail(orderNumber);
  if (!order) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/orders" className="text-sm text-forest-700">
            ← Orders
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-bold text-ink-900">
            <span className="font-mono">{order.orderNumber}</span>
            <Badge tone={orderStatusTone(order.status)}>{statusLabel(order.status)}</Badge>
          </h1>
          <p className="text-sm text-ink-500">
            {order.store.shortName} · {order.fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Pickup'} ·
            placed {formatDateTime(order.placedAt)}
          </p>
        </div>
        <Link href={`/orders/${order.orderNumber}/print`} className="btn-secondary no-print" target="_blank">
          <Printer className="h-4 w-4" /> Print pick sheet
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="card">
            <table className="w-full">
              <thead className="border-b border-ink-200 bg-ink-50">
                <tr>
                  <th className="th">Item</th>
                  <th className="th">Qty / weight</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Line</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((i) => (
                  <tr key={i.id} className="border-b border-ink-100 last:border-0 align-top">
                    <td className="td">
                      <p className="font-medium text-ink-900">{i.nameSnapshot}</p>
                      <p className="text-xs text-ink-400">
                        {i.skuSnapshot}
                        {i.variant ? ` · ${i.variant.name}` : ''} · {i.product.department.name}
                      </p>
                      {i.butcherInstruction && (
                        <p className="mt-0.5 text-xs text-rose-700">
                          Butcher: {butcherSummary(i.butcherInstruction.selections)}
                          {i.butcherInstruction.notes ? ` — “${i.butcherInstruction.notes}”` : ''}
                        </p>
                      )}
                      <p className="text-xs text-ink-400">
                        If unavailable: {statusLabel(i.substitution)}
                        {i.pickedBy ? ` · picked by ${i.pickedBy.firstName}` : ''}
                        {i.butcheredBy ? ` · cut by ${i.butcheredBy.firstName}` : ''}
                      </p>
                    </td>
                    <td className="td">
                      {i.unitType === 'WEIGHT'
                        ? `est ~${Number(i.requestedWeightLb ?? 0)} lb${
                            i.actualWeightLb ? ` · actual ${Number(i.actualWeightLb)} lb` : ''
                          }`
                        : `×${i.quantity}`}
                    </td>
                    <td className="td">
                      <Badge tone={orderStatusTone(i.status)}>{statusLabel(i.status)}</Badge>
                    </td>
                    <td className="td text-right font-semibold">
                      {formatCents(i.finalLineCents ?? i.estimatedLineCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-4">
            <p className="label mb-2">Status timeline</p>
            <ol className="space-y-1 text-sm">
              {order.statusHistory.map((h) => (
                <li key={h.id} className="flex justify-between">
                  <span>
                    {statusLabel(h.status)}
                    {h.changedBy?.firstName ? ` · ${h.changedBy.firstName}` : ''}
                    {h.note ? <span className="text-ink-400"> — {h.note}</span> : null}
                  </span>
                  <span className="text-ink-400">{formatDateTime(h.createdAt)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <p className="label mb-2">Advance order</p>
            <OrderStatusControls orderId={order.id} status={order.status} />
          </div>

          <div className="card p-4 text-sm">
            <p className="label mb-1">Totals</p>
            <Row label="Subtotal" v={formatCents(order.subtotalCents)} />
            {order.discountCents > 0 && <Row label="Discount" v={`−${formatCents(order.discountCents)}`} />}
            {order.deliveryFeeCents > 0 && <Row label="Delivery" v={formatCents(order.deliveryFeeCents)} />}
            <Row label="Tax" v={formatCents(order.taxCents)} />
            {order.tipCents > 0 && <Row label="Tip" v={formatCents(order.tipCents)} />}
            <div className="mt-1 border-t border-ink-200 pt-1 font-bold">
              <Row
                label={order.finalTotalCents ? 'Final total' : 'Estimated total'}
                v={formatCents(order.finalTotalCents ?? order.estimatedTotalCents)}
              />
            </div>
            <p className="mt-2 text-xs text-ink-400">
              Payment: {order.payments[0]?.status ?? 'none'} ({order.payments[0]?.provider ?? '—'})
            </p>
          </div>

          <div className="card p-4 text-sm">
            <p className="label mb-1">Customer</p>
            <p className="font-medium text-ink-900">{order.contactName}</p>
            <p className="text-ink-500">{order.contactPhone}</p>
            {order.contactEmail && <p className="text-ink-500">{order.contactEmail}</p>}
            {order.user && (
              <Link href={`/customers?q=${order.user.email}`} className="text-xs text-forest-700">
                View customer
              </Link>
            )}
            {order.address && (
              <p className="mt-2 text-ink-600">
                {order.address.line1}
                {order.address.line2 ? `, ${order.address.line2}` : ''}
                <br />
                {order.address.city}, {order.address.state} {order.address.postalCode}
                {order.address.gateCode ? ` · gate ${order.address.gateCode}` : ''}
                {order.deliveryInstructions ? (
                  <>
                    <br />
                    <span className="italic">“{order.deliveryInstructions}”</span>
                  </>
                ) : null}
              </p>
            )}
            {order.slot && (
              <p className="mt-2 text-ink-600">
                {slotLabel(order.slot.date, order.slot.startTime, order.slot.endTime)}
              </p>
            )}
            {(order.contactless || order.leaveAtDoor) && (
              <p className="mt-1 text-xs text-ink-500">
                {order.contactless ? 'Contactless' : ''} {order.leaveAtDoor ? '· Leave at door' : ''}
              </p>
            )}
            {order.customerNote && (
              <p className="mt-2 rounded bg-ink-50 p-2 text-xs italic">“{order.customerNote}”</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, v }: { label: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-500">{label}</span>
      <span>{v}</span>
    </div>
  );
}
