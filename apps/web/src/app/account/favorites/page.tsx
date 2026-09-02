import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { toProductCard } from '@oasisa2/api';
import { prisma } from '@oasisa2/database';
import { ProductGrid } from '@/components/product-grid';
import { getCurrentUser } from '@/lib/session';
import { getStoreContext } from '@/lib/store-context';

export const metadata: Metadata = { title: 'Favorites', robots: { index: false } };

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/account/login');
  const ctx = await getStoreContext();

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        include: {
          brand: true,
          department: true,
          category: true,
          images: { where: { isPrimary: true }, take: 1 },
          prices: true,
          inventory: true,
        },
      },
    },
  });

  const cards = favorites.map((f) =>
    toProductCard(
      {
        ...f.product,
        brand: f.product.brand ? { name: f.product.brand.name } : null,
        department: { slug: f.product.department.slug },
        category: { slug: f.product.category.slug },
        images: f.product.images.map((i) => ({ url: i.url })),
      } as never,
      ctx.store.id,
    ),
  );
  const favoriteIds = new Set(cards.map((c) => c.id));

  return (
    <div>
      <h1 className="text-2xl font-black text-charcoal-900">Favorites</h1>
      <div className="mt-5">
        <ProductGrid products={cards} favoriteIds={favoriteIds} emptyLabel="No favorites yet. Tap the heart on any product." />
      </div>
    </div>
  );
}
