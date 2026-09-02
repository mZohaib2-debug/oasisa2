import { requireRole } from '@/lib/auth';
import { getStoreScope } from '@/lib/store-scope';
import { dashboardMetrics, revenueByDay } from '@/server/reports';
import { StatCard } from '@/components/stat-card';
import { formatCents } from '@/lib/format';

export default async function ReportsPage() {
  await requireRole(['STORE_MANAGER']);
  const scope = await getStoreScope();
  const [m, byDay] = await Promise.all([
    dashboardMetrics(scope.storeId),
    revenueByDay(scope.storeId, 30),
  ]);

  const totalOrders = m.deliverySplit.pickup + m.deliverySplit.delivery || 1;
  const max = Math.max(1, ...byDay.map((d) => d.cents));

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-ink-900">Reports — {scope.shortName}</h1>
      <p className="text-sm text-ink-500">Rolling 30 days</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatCents(m.revenueCents)} tone="good" />
        <StatCard label="Orders" value={m.orderCount} />
        <StatCard label="Average order value" value={formatCents(m.aovCents)} />
        <StatCard label="New customers" value={m.newCustomers} />
        <StatCard
          label="Pickup share"
          value={`${Math.round((m.deliverySplit.pickup / totalOrders) * 100)}%`}
          sub={`${m.deliverySplit.pickup} orders`}
        />
        <StatCard
          label="Delivery share"
          value={`${Math.round((m.deliverySplit.delivery / totalOrders) * 100)}%`}
          sub={`${m.deliverySplit.delivery} orders`}
        />
        <StatCard label="Open orders" value={m.openOrders} tone={m.openOrders ? 'warn' : 'default'} />
        <StatCard label="Low / out of stock" value={m.lowStock} tone={m.lowStock ? 'warn' : 'good'} />
      </div>

      <div className="card p-4">
        <p className="label mb-3">Revenue by day (30d)</p>
        <div className="flex h-40 items-end gap-0.5">
          {byDay.map((d) => (
            <div
              key={d.date}
              className="flex-1 rounded-t bg-forest-400"
              style={{ height: `${Math.max(2, (d.cents / max) * 100)}%` }}
              title={`${d.date}: ${formatCents(d.cents)}`}
            />
          ))}
        </div>
      </div>

      <div className="card">
        <div className="border-b border-ink-200 px-4 py-2.5">
          <p className="text-sm font-bold text-ink-900">Best sellers (30d)</p>
        </div>
        <table className="w-full">
          <tbody>
            {m.topProducts.map((p, i) => (
              <tr key={p.name} className="border-b border-ink-100 last:border-0">
                <td className="td text-ink-400">{i + 1}</td>
                <td className="td font-medium">{p.name}</td>
                <td className="td text-right text-ink-500">
                  {p.units} units · {p.orders} orders
                </td>
              </tr>
            ))}
            {m.topProducts.length === 0 && (
              <tr>
                <td className="td text-ink-500">No sales in this window.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
