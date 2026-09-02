import { notFound } from 'next/navigation';
import { getOrderDetail } from '@/server/orders';
import { butcherSummary, formatCents, formatDateTime, slotLabel, statusLabel } from '@/lib/format';

type Props = { params: Promise<{ orderNumber: string }> };

export default async function PrintPage({ params }: Props) {
  const { orderNumber } = await params;
  const order = await getOrderDetail(orderNumber);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl bg-white p-6 text-ink-900">
      <div className="flex items-start justify-between border-b-2 border-ink-900 pb-2">
        <div>
          <p className="text-lg font-black">OasisA2 — {order.store.shortName}</p>
          <p className="text-sm">Pick sheet</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-bold">{order.orderNumber}</p>
          <p className="text-sm">{statusLabel(order.status)}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <p>
          <strong>Customer:</strong> {order.contactName} · {order.contactPhone}
        </p>
        <p>
          <strong>{order.fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Pickup'}:</strong>{' '}
          {order.slot ? slotLabel(order.slot.date, order.slot.startTime, order.slot.endTime) : 'ASAP'}
        </p>
        <p>
          <strong>Placed:</strong> {formatDateTime(order.placedAt)}
        </p>
        {order.address && (
          <p className="col-span-2">
            <strong>Address:</strong> {order.address.line1}
            {order.address.line2 ? `, ${order.address.line2}` : ''}, {order.address.city},{' '}
            {order.address.state} {order.address.postalCode}
          </p>
        )}
      </div>

      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-ink-900 text-left">
            <th className="py-1 w-8">✓</th>
            <th className="py-1">Item</th>
            <th className="py-1">Qty / weight</th>
            <th className="py-1">Notes</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id} className="border-b border-ink-300 align-top">
              <td className="py-2">☐</td>
              <td className="py-2">
                <strong>{i.nameSnapshot}</strong>
                <br />
                <span className="text-xs">{i.skuSnapshot}</span>
              </td>
              <td className="py-2">
                {i.unitType === 'WEIGHT' ? `~${Number(i.requestedWeightLb ?? 0)} lb` : `×${i.quantity}`}
              </td>
              <td className="py-2 text-xs">
                {i.butcherInstruction
                  ? `BUTCHER: ${butcherSummary(i.butcherInstruction.selections)}${
                      i.butcherInstruction.notes ? ` — ${i.butcherInstruction.notes}` : ''
                    }`
                  : ''}
                {` Sub: ${statusLabel(i.substitution)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-between text-sm">
        <p>Items: {order.items.length}</p>
        <p>
          <strong>{order.finalTotalCents ? 'Total' : 'Est. total'}:</strong>{' '}
          {formatCents(order.finalTotalCents ?? order.estimatedTotalCents)}
        </p>
      </div>
      {order.customerNote && <p className="mt-2 text-sm">Customer note: “{order.customerNote}”</p>}

      <p className="mt-6 text-xs text-ink-400 no-print">
        Use your browser&apos;s Print (Cmd/Ctrl+P) to print this sheet.
      </p>
    </div>
  );
}
