import Link from 'next/link';
import clsx from 'clsx';
import type { ProductCard as ProductCardData } from '@oasisa2/api';
import { ProductImage } from './product-image';
import { Price } from './price';
import { AddToCart } from './add-to-cart';
import { FavoriteButton } from './favorite-button';
import { halalLabel } from '@/lib/format';

export function ProductCard({
  product,
  isFavorite = false,
  showFavorite = true,
}: {
  product: ProductCardData;
  isFavorite?: boolean;
  showFavorite?: boolean;
}) {
  const halal = halalLabel(product.halalStatus);
  return (
    <div className="card group relative flex flex-col p-3">
      {showFavorite && (
        <div className="absolute right-2 top-2 z-10">
          <FavoriteButton productId={product.id} initial={isFavorite} />
        </div>
      )}
      <Link href={`/p/${product.slug}`} className="block">
        <ProductImage name={product.name} className="aspect-square w-full" />
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        {product.brandName && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-charcoal-700/50">
            {product.brandName}
          </span>
        )}
        <Link
          href={`/p/${product.slug}`}
          className="line-clamp-2 text-sm font-semibold text-charcoal-900 hover:text-forest-700"
        >
          {product.name}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {product.packageSize && (
            <span className="text-xs text-charcoal-700/60">{product.packageSize}</span>
          )}
          {halal && <span className="badge bg-forest-100 text-forest-800">{halal}</span>}
          {product.onSale && product.percentOff ? (
            <span className="badge bg-gold-400/20 text-gold-600">{product.percentOff}% off</span>
          ) : null}
        </div>

        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <Price
              unitPriceCents={product.unitPriceCents}
              wasPriceCents={product.wasPriceCents}
              unitType={product.unitType}
              size="sm"
            />
            {product.unitType === 'WEIGHT' && product.averageWeightLb ? (
              <span className="text-[11px] text-charcoal-700/55">
                ~{product.averageWeightLb} lb avg
              </span>
            ) : null}
          </div>
          {product.available ? (
            <AddToCart
              productId={product.id}
              unitType={product.unitType}
              requestedWeightLb={product.averageWeightLb ?? 1}
            />
          ) : (
            <span
              className={clsx(
                'badge',
                'bg-charcoal-700/10 text-charcoal-700/70',
              )}
            >
              Out of stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
