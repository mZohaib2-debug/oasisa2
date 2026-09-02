'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTransition } from 'react';
import {
  BarChart3,
  Boxes,
  ClipboardList,
  LogOut,
  Package,
  PieChart,
  ScissorsSquare,
  Store,
  Tag,
  Ticket,
  Users,
  UserCog,
} from 'lucide-react';
import clsx from 'clsx';
import { logoutAction, setStoreScopeAction } from '@/app/actions';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Operations',
    items: [
      { href: '/', label: 'Dashboard', icon: BarChart3 },
      { href: '/orders', label: 'Orders', icon: ClipboardList },
      { href: '/picking', label: 'Picking queue', icon: Package, roles: ['PICKER', 'STORE_MANAGER'] },
      { href: '/butcher', label: 'Butcher queue', icon: ScissorsSquare, roles: ['BUTCHER', 'STORE_MANAGER'] },
    ],
  },
  {
    section: 'Catalog',
    items: [
      { href: '/products', label: 'Products', icon: Package, roles: ['STORE_MANAGER'] },
      { href: '/brands', label: 'Brands', icon: Tag, roles: ['STORE_MANAGER'] },
      { href: '/inventory', label: 'Inventory', icon: Boxes, roles: ['STORE_MANAGER'] },
      { href: '/promotions', label: 'Promotions', icon: Tag, roles: ['STORE_MANAGER'] },
      { href: '/coupons', label: 'Coupons', icon: Ticket, roles: ['STORE_MANAGER'] },
    ],
  },
  {
    section: 'Configuration',
    items: [
      { href: '/stores', label: 'Stores', icon: Store, roles: ['STORE_MANAGER'] },
      { href: '/slots', label: 'Time slots', icon: ClipboardList, roles: ['STORE_MANAGER'] },
      { href: '/customers', label: 'Customers', icon: Users, roles: ['STORE_MANAGER'] },
      { href: '/staff', label: 'Staff', icon: UserCog, roles: ['ADMIN'] },
      { href: '/reports', label: 'Reports', icon: PieChart, roles: ['STORE_MANAGER'] },
    ],
  },
];

export function AppShell({
  user,
  scope,
  children,
}: {
  user: { name: string; role: string };
  scope: { slug: string; shortName: string; all: { slug: string; shortName: string }[] };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [pending, start] = useTransition();

  const visible = (item: NavItem) =>
    user.role === 'ADMIN' || !item.roles || item.roles.includes(user.role);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-ink-200 bg-white md:flex">
        <div className="flex items-center gap-2 border-b border-ink-200 px-4 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-forest-700 text-sm font-black text-white">
            O
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-ink-900">OasisA2</p>
            <p className="text-[11px] text-ink-500">Operations</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV.map((group) => {
            const items = group.items.filter(visible);
            if (!items.length) return null;
            return (
              <div key={group.section} className="mb-4">
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-ink-400">
                  {group.section}
                </p>
                {items.map((item) => {
                  const active =
                    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium',
                        active ? 'bg-forest-50 text-forest-800' : 'text-ink-600 hover:bg-ink-50',
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex items-center gap-3 border-b border-ink-200 bg-white px-4 py-2.5">
          <label className="flex items-center gap-1.5 text-sm">
            <Store className="h-4 w-4 text-ink-400" />
            <select
              value={scope.slug}
              disabled={pending}
              onChange={(e) =>
                start(async () => {
                  await setStoreScopeAction(e.target.value);
                })
              }
              className="rounded border border-ink-200 bg-white px-2 py-1 text-sm font-semibold"
            >
              {scope.all.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.shortName}
                </option>
              ))}
            </select>
          </label>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-ink-500">
              {user.name} · <span className="font-semibold text-ink-700">{user.role}</span>
            </span>
            <form action={logoutAction}>
              <button type="submit" className="btn-ghost px-2 py-1" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </header>

        {/* mobile nav */}
        <nav className="no-print flex gap-1 overflow-x-auto border-b border-ink-200 bg-white px-2 py-1.5 md:hidden">
          {NAV.flatMap((g) => g.items)
            .filter(visible)
            .map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'whitespace-nowrap rounded px-2 py-1 text-xs font-semibold',
                    active ? 'bg-forest-50 text-forest-800' : 'text-ink-600',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
