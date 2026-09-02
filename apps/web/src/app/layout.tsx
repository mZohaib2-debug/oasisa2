import type { Metadata } from 'next';
import './globals.css';
import { listStores } from '@oasisa2/api';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MobileNav } from '@/components/mobile-nav';
import { StoreOnboarding } from '@/components/store-onboarding';
import { hasStoreContext } from '@/lib/store-context';
import { getCartItemCount } from '@/lib/cart';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'OasisA2 — Fresh Halal Groceries, Ready When You Are',
    template: '%s · OasisA2',
  },
  description:
    'Shop fresh halal meats, produce, Pakistani and Indian groceries, spices, frozen favorites, and everyday essentials for pickup or local delivery from OasisA2 Supermarket.',
  openGraph: {
    type: 'website',
    siteName: 'OasisA2 Supermarket',
    title: 'OasisA2 — Fresh Halal Groceries, Ready When You Are',
    description:
      'Halal meat, fresh butcher service, and South Asian & Middle Eastern groceries. Pickup or local delivery.',
    url: SITE_URL,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const chosen = await hasStoreContext();
  const [stores, cartCount] = await Promise.all([
    chosen ? Promise.resolve([]) : listStores(),
    getCartItemCount(),
  ]);

  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="container-page min-h-[60vh] pb-24 pt-6 md:pb-12">
          {children}
        </main>
        <Footer />
        <MobileNav cartCount={cartCount} />
        {!chosen && (
          <StoreOnboarding
            stores={stores.map((s) => ({
              slug: s.slug,
              shortName: s.shortName,
              pickupEnabled: s.pickupEnabled,
              deliveryEnabled: s.deliveryEnabled,
            }))}
          />
        )}
      </body>
    </html>
  );
}
