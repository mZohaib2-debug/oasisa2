import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductDetail } from '@oasisa2/api';
import { prisma } from '@oasisa2/database';
import { ProductImage } from '@/components/product-image';
import { ProductPurchasePanel } from '@/components/product-purchase-panel';
import { ProductRail } from '@/components/product-grid';
import { FavoriteButton } from '@/components/favorite-button';
import { Price } from '@/components/price';
import { getStoreContext } from '@/lib/store-context';
import { getCurrentUser } from '@/lib/session';
import { halalLabel, inventoryLabel } from '@/lib/format';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await getStoreContext();
  const p = await getProductDetail(slug, ctx.store.id);
  if (!p) return {};
  return {
    title: p.name,
    description: p.shortDescription ?? `Buy ${p.name} at OasisA2.`,
    openGraph: { title: p.name, description: p.shortDescription ?? undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [ctx, user] = await Promise.all([getStoreContext(), getCurrentUser()]);
  const product = await getProductDetail(slug, ctx.store.id);
  if (!product) notFound();

  const isFavorite = user
    ? Boolean(
        await prisma.favorite.findUnique({
          where: { userId_productId: { userId: user.id, productId: product.id } },
        }),
      )
    : false;

  const halal = halalLabel(product.halalStatus);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription ?? undefined,
    brand: product.brandName ?? undefined,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: (product.price.unitPriceCents / 100).toFixed(2),
      availability: product.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="text-xs text-charcoal-700/60">
        <Link href={`/d/${product.department.slug}`} className="hover:underline">
          {product.department.name}
        </Link>{' '}
        /{' '}
        <Link href={`/c/${product.department.slug}/${product.category.slug}`} className="hover:underline">
          {product.category.name}
        </Link>
      </nav>

      <div className="mt-3 grid gap-8 lg:grid-cols-2">
        <div>
          <div className="relative">
            <ProductImage name={product.name} className="aspect-square w-full" />
            <div className="absolute right-3 top-3">
              <FavoriteButton productId={product.id} initial={isFavorite} />
            </div>
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.slice(0, 4).map((_, i) => (
                <ProductImage key={i} name={`${product.name} ${i}`} className="h-16 w-16" />
              ))}
            </div>
          )}
        </div>

        <div>
          {product.brandName && (
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal-700/50">
              {product.brandName}
            </span>
          )}
          <h1 className="text-2xl font-black text-charcoal-900">{product.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {product.packageSize && (
              <span className="text-sm text-charcoal-700/60">{product.packageSize}</span>
            )}
            {halal && <span className="badge bg-forest-100 text-forest-800">{halal}</span>}
            <span
              className={
                product.available
                  ? 'badge bg-forest-100 text-forest-800'
                  : 'badge bg-charcoal-700/10 text-charcoal-700/70'
              }
            >
              {inventoryLabel(product.inventoryState)} · {ctx.store.shortName}
            </span>
          </div>

          <div className="mt-3">
            <Price
              unitPriceCents={product.price.unitPriceCents}
              wasPriceCents={product.price.wasPriceCents}
              unitType={product.unitType}
              size="lg"
            />
          </div>

          {product.shortDescription && (
            <p className="mt-3 text-sm text-charcoal-700/80">{product.shortDescription}</p>
          )}

          <div className="mt-4">
            <ProductPurchasePanel
              productId={product.id}
              unitType={product.unitType}
              unitPriceCents={product.price.unitPriceCents}
              averageWeightLb={product.averageWeightLb}
              available={product.available}
              variants={product.variants}
              butcherGroups={product.butcherGroups}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-charcoal-700/70">
            <span>
              {ctx.fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Pickup'} from {ctx.store.shortName}
            </span>
            {product.isDemo && <span>· Demo item — price is sample data</span>}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {product.description && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-charcoal-700/60">
              Description
            </h2>
            <p className="mt-1 text-sm text-charcoal-700/85">{product.description}</p>
          </section>
        )}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-charcoal-700/60">Details</h2>
          <dl className="mt-1 space-y-1 text-sm">
            {product.ingredients && (
              <Row label="Ingredients" value={product.ingredients} />
            )}
            {product.allergens.length > 0 && (
              <Row label="Allergens" value={product.allergens.join(', ')} />
            )}
            {product.countryOfOrigin && (
              <Row label="Country of origin" value={product.countryOfOrigin} />
            )}
            {product.storageInstructions && (
              <Row label="Storage" value={product.storageInstructions} />
            )}
            {product.halalCertifier && (
              <Row label="Halal certifier" value={product.halalCertifier} />
            )}
          </dl>
        </section>
      </div>

      {product.related.length > 0 && (
        <ProductRail title="Related products" products={product.related} />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-36 shrink-0 font-semibold text-charcoal-700/60">{label}</dt>
      <dd className="text-charcoal-700/85">{value}</dd>
    </div>
  );
}
