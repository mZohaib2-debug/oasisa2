import type { Metadata } from 'next';
import { getFeaturedPromotions, getMerchandisingRails, listActiveCoupons } from '@oasisa2/api';
import { prisma } from '@oasisa2/database';
import { ProductGrid } from '@/components/product-grid';
import { getStoreContext } from '@/lib/store-context';
import { getCurrentUser } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Weekly Specials',
  description: 'This week’s deals and offers at OasisA2.',
};

export default async function SpecialsPage() {
  const [ctx, user] = await Promise.all([getStoreContext(), getCurrentUser()]);
  const [promos, rails, coupons, favRows] = await Promise.all([
    getFeaturedPromotions(ctx.store.id),
    getMerchandisingRails(ctx.store.id),
    listActiveCoupons(),
    user
      ? prisma.favorite.findMany({ where: { userId: user.id }, select: { productId: true } })
      : Promise.resolve([]),
  ]);
  const favoriteIds = new Set(favRows.map((f) => f.productId));

  return (
    <div>
      <h1 className="text-2xl font-black text-charcoal-900">Weekly Specials</h1>
      <p className="mt-1 text-sm text-charcoal-700/70">
        Offers for the {ctx.store.shortName} branch.
      </p>

      {promos.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {promos.map((p) => (
            <a key={p.id} href={p.href} className="card p-4 hover:border-forest-300">
              <span className="badge bg-gold-400/20 text-gold-600">Promotion</span>
              <p className="mt-1 font-bold text-charcoal-900">{p.name}</p>
              {p.description && <p className="text-sm text-charcoal-700/70">{p.description}</p>}
            </a>
          ))}
        </div>
      )}

      {coupons.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {coupons.map((c) => (
            <span key={c.code} className="rounded-lg border border-dashed border-forest-300 bg-forest-50 px-3 py-1.5 text-sm">
              Code <strong className="font-mono">{c.code}</strong>
              {c.minSubtotalCents ? ` · min $${(c.minSubtotalCents / 100).toFixed(0)}` : ''}
            </span>
          ))}
        </div>
      )}

      <h2 className="mt-8 text-lg font-bold text-charcoal-900">On sale now</h2>
      <div className="mt-3">
        <ProductGrid
          products={rails.weeklySpecials}
          favoriteIds={favoriteIds}
          emptyLabel="No items on sale right now."
        />
      </div>
    </div>
  );
}
