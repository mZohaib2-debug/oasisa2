import Link from 'next/link';
import { getStoreScope } from '@/lib/store-scope';
import { dashboardMetrics, revenueByDay } from '@/server/reports';
import { listOrders, pickingCounts } from '@/server/orders';
import { recentAudit } from '@/server/audit';
import { StatCard, Badge } from '@/components/stat-card';
import { formatCents, formatDateTime, orderStatusTone, statusLabel } from '@/lib/format';

export default async function DashboardPage() {
  const scope = await getStoreScope();
  const [m, spark, recent, queues, audit] = await Promise.all([
    dashboardMetrics(scope.storeId),
    revenueByDay(scope.storeId, 14),
    listOrders({ storeId: scope.storeId, pageSize: 8 }),
    pickingCounts(scope.storeId),
    recentAudit(8),
  ]);

  const max = Math.max(1, ...spark.map((d) => d.cents));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-900">Dashboard — {scope.shortName}</h1>
        <span className="text-sm text-ink-500">Last 30 days</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue (30d)" value={formatCents(m.revenueCents)} tone="good" />
        <StatCard label="Orders (30d)" value={m.orderCount} sub={`AOV ${formatCents(m.aovCents)}`} />
        <StatCard label="Open orders" value={m.openOrders} tone={m.openOrders > 0 ? 'warn' : 'default'} />
        <StatCard
          label="Low / out of stock"
          value={m.lowStock}
          tone={m.lowStock > 0 ? 'warn' : 'good'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="card p-4">
          <p className="label mb-3">Revenue — last 14 days</p>
          <div className="flex h-32 items-end gap-1">
            {spark.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.date}: ${formatCents(d.cents)}`}>
                <div
                  className="w-full rounded-t bg-forest-400"
                  style={{ height: `${Math.max(2, (d.cents / max) * 100)}%` }}
                />
                <span className="text-[9px] text-ink-400">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="card p-4">
            <p className="label">Fulfilment split (30d)</p>
            <p className="mt-1 text-sm">
              <span className="font-bold text-ink-900">{m.deliverySplit.pickup}</span> pickup ·{' '}
              <span className="font-bold text-ink-900">{m.deliverySplit.delivery}</span> delivery
            </p>
          </div>
          <div className="card p-4">
            <p className="label">Queues</p>
            <div className="mt-1 flex gap-4 text-sm">
              <Link href="/picking" className="font-semibold text-forest-700">
                {queues.picking} to pick
              </Link>
              <Link href="/butcher" className="font-semibold text-rose-700">
                {queues.butcher} to butcher
              </Link>
            </div>
          </div>
          <div className="card p-4">
            <p className="label">New customers (30d)</p>
            <p className="mt-1 text-2xl font-bold text-ink-900">{m.newCustomers}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between border-b border-ink-200 px-4 py-2.5">
            <p className="text-sm font-bold text-ink-900">Recent orders</p>
            <Link href="/orders" className="text-xs font-semibold text-forest-700">
              View all
            </Link>
          </div>
          <table className="w-full">
            <tbody>
              {recent.orders.map((o) => (
                <tr key={o.id} className="border-b border-ink-100 last:border-0">
                  <td className="td">
                    <Link href={`/orders/${o.orderNumber}`} className="font-mono font-semibold text-forest-700">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="td text-ink-500">{o.contactName}</td>
                  <td className="td">
                    <Badge tone={orderStatusTone(o.status)}>{statusLabel(o.status)}</Badge>
                  </td>
                  <td className="td text-right font-semibold">
                    {formatCents(o.finalTotalCents ?? o.estimatedTotalCents)}
                  </td>
                </tr>
              ))}
              {recent.orders.length === 0 && (
                <tr>
                  <td className="td text-ink-500">No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="border-b border-ink-200 px-4 py-2.5">
            <p className="text-sm font-bold text-ink-900">Top products (30d)</p>
          </div>
          <table className="w-full">
            <tbody>
              {m.topProducts.map((p) => (
                <tr key={p.name} className="border-b border-ink-100 last:border-0">
                  <td className="td">{p.name}</td>
                  <td className="td text-right text-ink-500">{p.units} units · {p.orders} orders</td>
                </tr>
              ))}
              {m.topProducts.length === 0 && (
                <tr>
                  <td className="td text-ink-500">No sales yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-ink-200 px-4 py-2.5">
          <p className="text-sm font-bold text-ink-900">Recent staff activity</p>
        </div>
        <ul className="divide-y divide-ink-100">
          {audit.map((a) => (
            <li key={a.id} className="flex justify-between px-4 py-2 text-sm">
              <span>
                <span className="font-semibold text-ink-800">
                  {a.actor?.firstName ?? 'System'}
                </span>{' '}
                {a.action.toLowerCase().replace('_', ' ')} {a.entityType}
              </span>
              <span className="text-ink-400">{formatDateTime(a.createdAt)}</span>
            </li>
          ))}
          {audit.length === 0 && <li className="px-4 py-2 text-sm text-ink-500">No activity yet.</li>}
        </ul>
      </div>
    </div>
  );
}
