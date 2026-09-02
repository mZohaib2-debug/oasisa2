import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, listProducts } from '@oasisa2/api';
import { prisma } from '@oasisa2/database';
import { ProductGrid } from '@/components/product-grid';
import { BrowserControls, Pagination, SubcategoryChips } from '@/components/browser-controls';
import { getStoreContext } from '@/lib/store-context';
import { getCurrentUser } from '@/lib/session';
import { parseProductFilter } from '@/lib/filters';

type Props = {
  params: Promise<{ department: string; category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { department, category } = await params;
  const cat = await getCategoryBySlug(department, category);
  if (!cat) return {};
  return {
    title: `${cat.name} · ${cat.department.name}`,
    description: cat.description ?? `Shop ${cat.name} at OasisA2.`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { department, category } = await params;
  const sp = await searchParams;
  const [cat, ctx, user] = await Promise.all([
    getCategoryBySlug(department, category),
    getStoreContext(),
    getCurrentUser(),
  ]);
  if (!cat) notFound();

  const filter = parseProductFilter(sp, { department, category });
  const [results, favRows] = await Promise.all([
    listProducts(filter, ctx.store.id),
    user
      ? prisma.favorite.findMany({ where: { userId: user.id }, select: { productId: true } })
      : Promise.resolve([]),
  ]);
  const favoriteIds = new Set(favRows.map((f) => f.productId));

  return (
    <div>
      <nav className="text-xs text-charcoal-700/60">
        <Link href="/departments" className="hover:underline">Departments</Link> /{' '}
        <Link href={`/d/${cat.department.slug}`} className="hover:underline">
          {cat.department.name}
        </Link>{' '}
        / {cat.name}
      </nav>
      <h1 className="mt-1 text-2xl font-black text-charcoal-900">{cat.name}</h1>

      <div className="mt-4">
        <SubcategoryChips
          department={department}
          category={category}
          subcategories={cat.subcategories.map((s) => ({ slug: s.slug, name: s.name }))}
          active={typeof sp.subcategory === 'string' ? sp.subcategory : undefined}
        />
        <BrowserControls total={results.total} />
        <ProductGrid products={results.items} favoriteIds={favoriteIds} />
        <Pagination page={results.page} totalPages={results.totalPages} />
      </div>
    </div>
  );
}
