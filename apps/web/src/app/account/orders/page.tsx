import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getBuyAgainItems, listOrders } from '@oasisa2/api';
import { ProductGrid } from '@/components/product-grid';
import { ReorderButton } from '@/components/reorder-button';
import { getCurrentUser } from '@/lib/session';
import { getStoreContext } from '@/lib/store-context';
import { formatCents, orderStatusLabel } from '@/lib/format';

export const metadata: Metadata = { title: 'Order History', robots: { index: false } };

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/account/login');
  const ctx = await getStoreContext();

  const [orders, buyAgain] = await Promise.all([
    listOrders(user.id),
    getBuyAgainItems(user.id, ctx.store.id),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-black text-charcoal-900">Order History</h1>

      {buyAgain.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-3 text-lg font-bold text-charcoal-900">Buy Again</h2>
          <ProductGrid products={buyAgain} />
        </section>
      )}

      <section className="mt-8 space-y-3">
        {orders.length === 0 ? (
          <p className="text-sm text-charcoal-700/70">You have no orders yet.</p>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-charcoal-900">{o.orderNumber}</span>
                  <span className="ml-2 badge bg-forest-100 text-forest-800">
                    {orderStatusLabel(o.status)}
                  </span>
                  <p className="text-xs text-charcoal-700/60">
                    {o.store.shortName} · {o.fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Pickup'} ·{' '}
                    {new Date(o.placedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">
                    {formatCents(o.finalTotalCents ?? o.estimatedTotalCents)}
                  </span>
                  <ReorderButton orderNumber={o.orderNumber} />
                  <Link
                    href={`/account/orders/${o.orderNumber}`}
                    className="text-sm font-semibold text-forest-700 hover:underline"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
