import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { listOrders } from '@oasisa2/api';
import { prisma } from '@oasisa2/database';
import { getCurrentUser } from '@/lib/session';
import { formatCents, orderStatusLabel } from '@/lib/format';

export const metadata: Metadata = { title: 'My Account', robots: { index: false } };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/account/login');

  const [orders, favCount, listCount] = await Promise.all([
    listOrders(user.id),
    prisma.favorite.count({ where: { userId: user.id } }),
    prisma.savedList.count({ where: { userId: user.id } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-black text-charcoal-900">
        Welcome back{user.firstName ? `, ${user.firstName}` : ''}
      </h1>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Orders" value={orders.length} href="/account/orders" />
        <Stat label="Favorites" value={favCount} href="/account/favorites" />
        <Stat label="Saved lists" value={listCount} href="/account/lists" />
      </div>

      <h2 className="mt-8 text-lg font-bold text-charcoal-900">Recent orders</h2>
      {orders.length === 0 ? (
        <p className="mt-2 text-sm text-charcoal-700/70">No orders yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {orders.slice(0, 5).map((o) => (
            <li key={o.id}>
              <Link href={`/account/orders/${o.orderNumber}`} className="card flex items-center justify-between p-3 text-sm hover:border-forest-300">
                <span>
                  <span className="font-mono font-bold">{o.orderNumber}</span>
                  <span className="text-charcoal-700/60"> · {o.store.shortName} · {o.items.length} items</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="badge bg-forest-100 text-forest-800">{orderStatusLabel(o.status)}</span>
                  <span className="font-bold">{formatCents(o.finalTotalCents ?? o.estimatedTotalCents)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card p-4 hover:border-forest-300">
      <span className="text-2xl font-black text-charcoal-900">{value}</span>
      <span className="block text-sm text-charcoal-700/60">{label}</span>
    </Link>
  );
}
