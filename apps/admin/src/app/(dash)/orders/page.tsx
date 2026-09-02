import Link from 'next/link';
import { OrderStatus } from '@oasisa2/types';
import { getStoreScope } from '@/lib/store-scope';
import { listOrders } from '@/server/orders';
import { Badge } from '@/components/stat-card';
import { formatCents, formatDateTime, orderStatusTone, slotLabel, statusLabel } from '@/lib/format';

type Props = { searchParams: Promise<Record<string, string | undefined>> };

const STATUSES = Object.values(OrderStatus);

export default async function OrdersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const scope = await getStoreScope();
  const page = Number(sp.page || 1);

  const { orders, total, totalPages, statusCounts } = await listOrders({
    storeId: scope.storeId,
    status: (sp.status as OrderStatus) || undefined,
    fulfillmentType: (sp.f as 'PICKUP' | 'DELIVERY') || undefined,
    q: sp.q || undefined,
    page,
  });

  const qs = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { ...sp, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    return `?${next.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink-900">Orders — {scope.shortName}</h1>
        <span className="text-sm text-ink-500">{total} total</span>
      </div>

      <form className="flex flex-wrap gap-2" action="/orders">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Search order #, name, phone, email"
          className="field max-w-xs"
        />
        <select name="status" defaultValue={sp.status ?? ''} className="field w-auto">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)} {statusCounts[s] ? `(${statusCounts[s]})` : ''}
            </option>
          ))}
        </select>
        <select name="f" defaultValue={sp.f ?? ''} className="field w-auto">
          <option value="">Pickup &amp; delivery</option>
          <option value="PICKUP">Pickup</option>
          <option value="DELIVERY">Delivery</option>
        </select>
        <button type="submit" className="btn-secondary">
          Filter
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-ink-200 bg-ink-50">
            <tr>
              <th className="th">Order</th>
              <th className="th">Placed</th>
              <th className="th">Customer</th>
              <th className="th">Fulfilment</th>
              <th className="th">Slot</th>
              <th className="th">Status</th>
              <th className="th text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="row-link border-b border-ink-100 last:border-0">
                <td className="td">
                  <Link href={`/orders/${o.orderNumber}`} className="font-mono font-semibold text-forest-700">
                    {o.orderNumber}
                  </Link>
                  <span className="ml-1 text-xs text-ink-400">· {o._count.items} items</span>
                </td>
                <td className="td text-ink-500">{formatDateTime(o.placedAt)}</td>
                <td className="td">{o.contactName}</td>
                <td className="td">{o.fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Pickup'}</td>
                <td className="td text-ink-500">
                  {o.slot ? slotLabel(o.slot.date, o.slot.startTime, o.slot.endTime) : '—'}
                </td>
                <td className="td">
                  <Badge tone={orderStatusTone(o.status)}>{statusLabel(o.status)}</Badge>
                </td>
                <td className="td text-right font-semibold">
                  {formatCents(o.finalTotalCents ?? o.estimatedTotalCents)}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td className="td text-ink-500" colSpan={7}>
                  No orders match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link href={qs({ page: String(page - 1) })} className="btn-secondary">
              Previous
            </Link>
          )}
          <span className="text-ink-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={qs({ page: String(page + 1) })} className="btn-secondary">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
