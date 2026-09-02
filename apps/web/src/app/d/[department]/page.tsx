import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDepartmentBySlug, listProducts } from '@oasisa2/api';
import { prisma } from '@oasisa2/database';
import { ProductGrid } from '@/components/product-grid';
import { BrowserControls, Pagination } from '@/components/browser-controls';
import { getStoreContext } from '@/lib/store-context';
import { getCurrentUser } from '@/lib/session';
import { parseProductFilter } from '@/lib/filters';

type Props = {
  params: Promise<{ department: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { department } = await params;
  const dept = await getDepartmentBySlug(department);
  if (!dept) return {};
  return {
    title: dept.name,
    description: dept.description ?? `Shop ${dept.name} at OasisA2.`,
  };
}

export default async function DepartmentPage({ params, searchParams }: Props) {
  const { department } = await params;
  const sp = await searchParams;
  const [dept, ctx, user] = await Promise.all([
    getDepartmentBySlug(department),
    getStoreContext(),
    getCurrentUser(),
  ]);
  if (!dept) notFound();

  const filter = parseProductFilter(sp, { department });
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
        <Link href="/departments" className="hover:underline">Departments</Link> / {dept.name}
      </nav>
      <h1 className="mt-1 text-2xl font-black text-charcoal-900">{dept.name}</h1>
      {dept.description && <p className="mt-1 text-sm text-charcoal-700/70">{dept.description}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {dept.categories.map((c) => (
          <Link
            key={c.slug}
            href={`/c/${dept.slug}/${c.slug}`}
            className="rounded-full border border-charcoal-700/15 px-3 py-1.5 text-xs font-semibold text-charcoal-700/80 hover:bg-forest-50"
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <BrowserControls total={results.total} />
        <ProductGrid products={results.items} favoriteIds={favoriteIds} />
        <Pagination page={results.page} totalPages={results.totalPages} />
      </div>
    </div>
  );
}
