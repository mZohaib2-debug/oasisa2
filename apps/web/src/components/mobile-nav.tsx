'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Search, ShoppingCart, ClipboardList } from 'lucide-react';
import clsx from 'clsx';

const ITEMS = [
  { href: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
  { href: '/departments', label: 'Browse', icon: LayoutGrid, match: (p: string) => p.startsWith('/departments') || p.startsWith('/d/') || p.startsWith('/c/') },
  { href: '/search', label: 'Search', icon: Search, match: (p: string) => p.startsWith('/search') },
  { href: '/account/orders', label: 'Orders', icon: ClipboardList, match: (p: string) => p.startsWith('/account/orders') },
  { href: '/cart', label: 'Cart', icon: ShoppingCart, match: (p: string) => p.startsWith('/cart') },
];

export function MobileNav({ cartCount }: { cartCount: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal-700/10 bg-white/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={clsx(
                  'flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold',
                  active ? 'text-forest-700' : 'text-charcoal-700/55',
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {href === '/cart' && cartCount > 0 && (
                    <span className="absolute -right-2 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-gold-500 px-0.5 text-[10px] font-bold text-charcoal-900">
                      {cartCount}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
