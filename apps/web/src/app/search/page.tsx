import type { Metadata } from 'next';
import { expandQuery } from '@oasisa2/commerce';
import { listProducts } from '@oasisa2/api';
import { prisma } from '@oasisa2/database';
import { ProductGrid } from '@/components/product-grid';
import { BrowserControls, Pagination } from '@/components/browser-controls';
import { getStoreContext } from '@/lib/store-context';
import { getCurrentUser } from '@/lib/session';
import { parseProductFilter } from '@/lib/filters';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  return { title: q ? `Search: ${q}` : 'Search', robots: { index: false } };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = typeof sp.q === 'string' ? sp.q : '';
  const [ctx, user] = await Promise.all([getStoreContext(), getCurrentUser()]);
  const filter = parseProductFilter(sp, { q });
  const [results, favRows] = await Promise.all([
    listProducts(filter, ctx.store.id),
    user
      ? prisma.favorite.findMany({ where: { userId: user.id }, select: { productId: true } })
      : Promise.resolve([]),
  ]);
  const favoriteIds = new Set(favRows.map((f) => f.productId));
  const expanded = q ? expandQuery(q).filter((t) => t !== q.toLowerCase()) : [];

  return (
    <div>
      <h1 className="text-2xl font-black text-charcoal-900">
        {q ? <>Results for “{q}”</> : 'Search'}
      </h1>
      {expanded.length > 0 && (
        <p className="mt-1 text-xs text-charcoal-700/60">
          Also matching: {expanded.slice(0, 6).join(', ')}
        </p>
      )}

      <div className="mt-5">
        <BrowserControls total={results.total} />
        <ProductGrid
          products={results.items}
          favoriteIds={favoriteIds}
          emptyLabel={q ? `No products match “${q}”. Try a different term.` : 'Type a search above.'}
        />
        <Pagination page={results.page} totalPages={results.totalPages} />
      </div>
    </div>
  );
}
