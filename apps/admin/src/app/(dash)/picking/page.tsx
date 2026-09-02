import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { getStoreScope } from '@/lib/store-scope';
import { pickingQueue } from '@/server/orders';
import { Badge } from '@/components/stat-card';
import { orderStatusTone, slotLabel, statusLabel } from '@/lib/format';

export default async function PickingPage() {
  await requireRole(['PICKER', 'STORE_MANAGER']);
  const scope = await getStoreScope();
  const orders = await pickingQueue(scope.storeId);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ink-900">Picking queue — {scope.shortName}</h1>
      <p className="text-sm text-ink-500">{orders.length} orders waiting. Oldest first.</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((o) => {
          const done = o.items.filter((i) =>
            ['PICKED', 'SUBSTITUTED', 'NOT_AVAILABLE', 'BUTCHER_DONE', 'PACKED'].includes(i.status),
          ).length;
          const butcherItems = o.items.filter((i) => i.unitType === 'WEIGHT').length;
          return (
            <Link key={o.id} href={`/picking/${o.orderNumber}`} className="card p-4 hover:border-forest-300">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-forest-700">{o.orderNumber}</span>
                <Badge tone={orderStatusTone(o.status)}>{statusLabel(o.status)}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-600">
                {done}/{o._count.items} items picked
                {butcherItems > 0 ? ` · ${butcherItems} for butcher` : ''}
              </p>
              <p className="text-xs text-ink-400">
                {o.fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Pickup'} ·{' '}
                {o.slot ? slotLabel(o.slot.date, o.slot.startTime, o.slot.endTime) : 'ASAP'}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded bg-ink-100">
                <div
                  className="h-full bg-forest-500"
                  style={{ width: `${o._count.items ? (done / o._count.items) * 100 : 0}%` }}
                />
              </div>
            </Link>
          );
        })}
        {orders.length === 0 && (
          <p className="text-sm text-ink-500">Nothing to pick right now. 🎉</p>
        )}
      </div>
    </div>
  );
}
