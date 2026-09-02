import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { getStoreScope } from '@/lib/store-scope';
import { butcherQueue } from '@/server/orders';
import { ButcherWeightForm } from '@/components/butcher-weight-form';
import { butcherSummary, slotLabel } from '@/lib/format';

export default async function ButcherPage() {
  await requireRole(['BUTCHER', 'STORE_MANAGER']);
  const scope = await getStoreScope();
  const items = await butcherQueue(scope.storeId);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ink-900">Butcher queue — {scope.shortName}</h1>
      <p className="text-sm text-ink-500">
        {items.length} cuts to prepare. Enter the actual prepared weight — the order total updates
        automatically.
      </p>

      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-ink-900">{i.product.name}</p>
                <p className="text-xs text-ink-400">
                  <Link href={`/orders/${i.order.orderNumber}`} className="font-mono text-forest-700">
                    {i.order.orderNumber}
                  </Link>{' '}
                  · {i.order.fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Pickup'} ·{' '}
                  {i.order.slot
                    ? slotLabel(i.order.slot.date, i.order.slot.startTime, i.order.slot.endTime)
                    : 'ASAP'}
                </p>
              </div>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
                {i.status === 'SENT_TO_BUTCHER' ? 'Sent by picker' : 'Pending'}
              </span>
            </div>

            <div className="mt-2 rounded bg-rose-50 p-2 text-sm text-rose-900">
              <strong>Prep:</strong>{' '}
              {i.butcherInstruction
                ? butcherSummary(i.butcherInstruction.selections) || 'see notes'
                : 'standard cut'}
              {i.butcherInstruction?.notes ? (
                <span className="italic"> — “{i.butcherInstruction.notes}”</span>
              ) : null}
            </div>

            <div className="mt-3">
              <ButcherWeightForm
                orderItemId={i.id}
                estimateLb={Number(i.requestedWeightLb ?? 1)}
                pricePerPoundCents={i.unitPriceCents}
              />
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-ink-500">No cuts waiting. 🔪</p>}
      </div>
    </div>
  );
}
