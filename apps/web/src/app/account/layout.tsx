import Link from 'next/link';
import { getCurrentUser } from '@/lib/session';
import { logoutAction } from '@/app/actions';

const NAV = [
  { href: '/account', label: 'Overview' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/favorites', label: 'Favorites' },
  { href: '/account/lists', label: 'Saved Lists' },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) return <div className="mx-auto max-w-3xl">{children}</div>;

  return (
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      <aside className="space-y-1">
        <p className="px-3 pb-2 text-sm font-bold text-charcoal-900">
          {user.firstName ?? 'My account'}
        </p>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-charcoal-700/80 hover:bg-forest-50"
          >
            {n.label}
          </Link>
        ))}
        <form action={logoutAction}>
          <button type="submit" className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">
            Sign out
          </button>
        </form>
      </aside>
      <div>{children}</div>
    </div>
  );
}
