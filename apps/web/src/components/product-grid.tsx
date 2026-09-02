import type { ProductCard as ProductCardData } from '@oasisa2/api';
import { ProductCard } from './product-card';

export function ProductGrid({
  products,
  favoriteIds,
  emptyLabel = 'No products found.',
}: {
  products: ProductCardData[];
  favoriteIds?: Set<string>;
  emptyLabel?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-charcoal-700/70">{emptyLabel}</div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} isFavorite={favoriteIds?.has(p.id) ?? false} />
      ))}
    </div>
  );
}

export function ProductRail({
  title,
  href,
  products,
  favoriteIds,
}: {
  title: string;
  href?: string;
  products: ProductCardData[];
  favoriteIds?: Set<string>;
}) {
  if (products.length === 0) return null;
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-lg font-bold text-charcoal-900">{title}</h2>
        {href && (
          <a href={href} className="text-sm font-semibold text-forest-700 hover:underline">
            See all
          </a>
        )}
      </div>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {products.map((p) => (
          <div key={p.id} className="w-40 shrink-0 snap-start sm:w-44">
            <ProductCard product={p} isFavorite={favoriteIds?.has(p.id) ?? false} />
          </div>
        ))}
      </div>
    </section>
  );
}
