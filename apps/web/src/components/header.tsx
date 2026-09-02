import Link from 'next/link';
import { Heart, ListChecks, ShoppingCart, User2 } from 'lucide-react';
import { listStores, getNavigationTree } from '@oasisa2/api';
import { getStoreContext } from '@/lib/store-context';
import { getCartItemCount } from '@/lib/cart';
import { getCurrentUser } from '@/lib/session';
import { StoreSwitcher } from './store-switcher';
import { SearchBar } from './search-bar';

export async function Header() {
  const [stores, ctx, cartCount, user, nav] = await Promise.all([
    listStores(),
    getStoreContext(),
    getCartItemCount(),
    getCurrentUser(),
    getNavigationTree(),
  ]);

  const topDepartments = nav.slice(0, 10);

  return (
    <header className="sticky top-0 z-40 border-b border-charcoal-700/10 bg-cream-50/95 backdrop-blur">
      <div className="container-page flex items-center gap-3 py-2.5">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="OasisA2 home">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-forest-700 font-black text-white">
            O
          </span>
          <span className="hidden text-lg font-black tracking-tight text-forest-800 sm:block">
            OasisA2
          </span>
        </Link>

        <div className="hidden shrink-0 md:block">
          <StoreSwitcher
            stores={stores.map((s) => ({
              slug: s.slug,
              shortName: s.shortName,
              pickupEnabled: s.pickupEnabled,
              deliveryEnabled: s.deliveryEnabled,
            }))}
            current={{
              storeSlug: ctx.store.slug,
              storeName: ctx.store.shortName,
              fulfillmentType: ctx.fulfillmentType,
              postalCode: ctx.deliveryPostalCode,
              chosen: ctx.chosen,
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <SearchBar />
        </div>

        <nav className="flex shrink-0 items-center gap-1">
          <Link href="/account/favorites" className="btn-ghost hidden px-2 sm:inline-flex" aria-label="Favorites">
            <Heart className="h-5 w-5" />
          </Link>
          <Link href="/account/lists" className="btn-ghost hidden px-2 lg:inline-flex" aria-label="Saved lists">
            <ListChecks className="h-5 w-5" />
          </Link>
          <Link
            href={user ? '/account' : '/account/login'}
            className="btn-ghost px-2"
            aria-label={user ? 'Account' : 'Sign in'}
          >
            <User2 className="h-5 w-5" />
            <span className="hidden text-sm lg:inline">
              {user ? (user.firstName ?? 'Account') : 'Sign in'}
            </span>
          </Link>
          <Link href="/cart" className="btn-primary relative px-3" aria-label={`Cart, ${cartCount} items`}>
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-gold-500 px-1 text-[11px] font-bold text-charcoal-900">
                {cartCount}
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* mobile store switcher */}
      <div className="container-page pb-2 md:hidden">
        <StoreSwitcher
          compact
          stores={stores.map((s) => ({
            slug: s.slug,
            shortName: s.shortName,
            pickupEnabled: s.pickupEnabled,
            deliveryEnabled: s.deliveryEnabled,
          }))}
          current={{
            storeSlug: ctx.store.slug,
            storeName: ctx.store.shortName,
            fulfillmentType: ctx.fulfillmentType,
            postalCode: ctx.deliveryPostalCode,
            chosen: ctx.chosen,
          }}
        />
      </div>

      <div className="border-t border-charcoal-700/10 bg-white">
        <div className="container-page flex items-center gap-4 overflow-x-auto py-2 text-sm">
          <Link href="/departments" className="whitespace-nowrap font-semibold text-forest-800">
            All Departments
          </Link>
          {topDepartments.map((d) => (
            <Link
              key={d.slug}
              href={`/d/${d.slug}`}
              className="whitespace-nowrap text-charcoal-700/80 hover:text-forest-700"
            >
              {d.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
