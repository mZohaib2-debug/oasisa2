import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@oasisa2/database';
import { AddListButton } from '@/components/reorder-button';
import { getCurrentUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Saved Lists', robots: { index: false } };

export default async function ListsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/account/login');

  const lists = await prisma.savedList.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    include: { items: { include: { product: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-black text-charcoal-900">Saved Lists</h1>
      <p className="mt-1 text-sm text-charcoal-700/70">
        Reusable grocery lists — add the whole list to your cart in one tap.
      </p>

      {lists.length === 0 ? (
        <p className="mt-4 text-sm text-charcoal-700/70">No saved lists yet.</p>
      ) : (
        <div className="mt-5 space-y-4">
          {lists.map((list) => (
            <div key={list.id} className="card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-charcoal-900">{list.name}</h2>
                <AddListButton listId={list.id} />
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-charcoal-700/80">
                {list.items.map((i) => (
                  <li key={i.id}>
                    <Link href={`/p/${i.product.slug}`} className="hover:underline">
                      {i.product.name}
                    </Link>
                    <span className="text-charcoal-700/50">
                      {' '}
                      ·{' '}
                      {i.product.unitType === 'WEIGHT'
                        ? `~${Number(i.requestedWeightLb ?? i.product.averageWeightLb ?? 1)} lb`
                        : `×${i.quantity}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
