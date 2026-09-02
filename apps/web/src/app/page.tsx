import Link from 'next/link';
import { ArrowRight, Beef, Leaf, Package, Truck } from 'lucide-react';
import {
  getBuyAgainItems,
  getFeaturedPromotions,
  getMerchandisingRails,
  getNavigationTree,
  listProducts,
} from '@oasisa2/api';
import { prisma } from '@oasisa2/database';
import { ProductRail } from '@/components/product-grid';
import { getStoreContext } from '@/lib/store-context';
import { getCurrentUser } from '@/lib/session';

export default async function HomePage() {
  const ctx = await getStoreContext();
  const storeId = ctx.store.id;
  const user = await getCurrentUser();

  const [rails, promos, nav, meat, produce, pantry, buyAgain, favRows] = await Promise.all([
    getMerchandisingRails(storeId),
    getFeaturedPromotions(storeId),
    getNavigationTree(),
    listProducts({ department: 'meat-poultry', sort: 'popular', page: 1, pageSize: 12 }, storeId),
    listProducts({ department: 'produce', sort: 'popular', page: 1, pageSize: 12 }, storeId),
    listProducts({ department: 'pantry-canned', sort: 'popular', page: 1, pageSize: 12 }, storeId),
    user ? getBuyAgainItems(user.id, storeId) : Promise.resolve([]),
    user
      ? prisma.favorite.findMany({ where: { userId: user.id }, select: { productId: true } })
      : Promise.resolve([]),
  ]);

  const favoriteIds = new Set(favRows.map((f) => f.productId));

  return (
    <div>
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl bg-forest-800 text-cream-50">
        <div className="grid gap-6 p-6 sm:p-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-400">
              Fresh. Halal. Local.
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              Fresh Halal Groceries, Ready When You Are
            </h1>
            <p className="mt-3 max-w-md text-cream-100/80">
              Shop fresh halal meats, produce, Pakistani and Indian groceries, spices, frozen
              favorites, and everyday essentials.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/departments" className="btn bg-gold-500 text-charcoal-900 hover:bg-gold-400">
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/specials" className="btn border border-cream-100/30 text-cream-50 hover:bg-forest-700">
                Weekly Specials
              </Link>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-3 text-sm">
            {[
              { icon: Beef, label: 'Halal Meat' },
              { icon: Leaf, label: 'Fresh Produce' },
              { icon: Package, label: 'Store Pickup' },
              { icon: Truck, label: 'Local Delivery' },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 rounded-lg bg-forest-700/60 px-3 py-3 font-semibold">
                <Icon className="h-5 w-5 text-gold-400" /> {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Weekly specials banner */}
      {promos.length > 0 && (
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {promos.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              className="card flex items-center justify-between gap-3 p-4 hover:border-forest-300"
            >
              <div>
                <span className="badge bg-gold-400/20 text-gold-600">Weekly Special</span>
                <p className="mt-1 font-bold text-charcoal-900">{p.name}</p>
                {p.description && (
                  <p className="text-sm text-charcoal-700/70">{p.description}</p>
                )}
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-forest-700" />
            </Link>
          ))}
        </section>
      )}

      {/* Repeat-customer rails first */}
      {buyAgain.length > 0 && (
        <ProductRail title="Buy Again" href="/account/orders" products={buyAgain} favoriteIds={favoriteIds} />
      )}

      <ProductRail title="Weekly Specials" href="/specials" products={rails.weeklySpecials} favoriteIds={favoriteIds} />
      <ProductRail title="Popular Products" href="/departments" products={rails.featured} favoriteIds={favoriteIds} />

      {/* Shop by department */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-bold text-charcoal-900">Shop by Department</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {nav.map((d) => (
            <Link
              key={d.slug}
              href={`/d/${d.slug}`}
              className="card flex flex-col justify-between p-4 hover:border-forest-300"
            >
              <span className="font-bold text-charcoal-900">{d.name}</span>
              <span className="mt-1 text-xs text-charcoal-700/60">
                {d.categories.length} categories
              </span>
            </Link>
          ))}
        </div>
      </section>

      <ProductRail title="Fresh From the Butcher" href="/d/meat-poultry" products={meat.items} favoriteIds={favoriteIds} />
      <ProductRail title="Fresh Produce" href="/d/produce" products={produce.items} favoriteIds={favoriteIds} />
      <ProductRail title="Pantry Essentials" href="/d/pantry-canned" products={pantry.items} favoriteIds={favoriteIds} />
      {rails.newArrivals.length > 0 && (
        <ProductRail title="New Arrivals" products={rails.newArrivals} favoriteIds={favoriteIds} />
      )}
    </div>
  );
}
