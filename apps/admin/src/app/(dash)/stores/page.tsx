import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { listStoresAdmin } from '@/server/stores';
import { formatCents } from '@/lib/format';

export default async function StoresPage() {
  await requireRole(['STORE_MANAGER']);
  const stores = await listStoresAdmin();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ink-900">Stores</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {stores.map((s) => {
          const addressKnown = !s.line1.startsWith('TBD') && s.postalCode !== 'TBD';
          return (
            <Link key={s.id} href={`/stores/${s.slug}`} className="card p-4 hover:border-forest-300">
              <div className="flex items-center justify-between">
                <p className="font-bold text-ink-900">{s.name}</p>
                {!addressKnown && (
                  <span className="badge bg-amber-100 text-amber-800">Needs setup</span>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-500">
                {addressKnown ? `${s.line1}, ${s.city}, ${s.state} ${s.postalCode}` : 'Address TBD'}
              </p>
              <p className="text-sm text-ink-500">{s.phone ?? 'Phone TBD'}</p>
              <p className="mt-1 text-xs text-ink-400">
                {s.pickupEnabled ? 'Pickup' : 'No pickup'} ·{' '}
                {s.deliveryEnabled
                  ? `Delivery ${formatCents(s.deliveryFeeCents)} / min ${formatCents(s.deliveryMinimumCents)}`
                  : 'No delivery'}{' '}
                · {s._count.deliveryZones} zones · {s._count.orders} orders
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
