import type { Metadata } from 'next';
import Link from 'next/link';
import { getNavigationTree } from '@oasisa2/api';

export const metadata: Metadata = {
  title: 'All Departments',
  description: 'Browse every department at OasisA2 — halal meat, produce, rice, spices, and more.',
};

export default async function DepartmentsPage() {
  const nav = await getNavigationTree();
  return (
    <div>
      <h1 className="text-2xl font-black text-charcoal-900">All Departments</h1>
      <p className="mt-1 text-sm text-charcoal-700/70">
        {nav.length} departments · {nav.reduce((n, d) => n + d.categories.length, 0)} categories
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {nav.map((d) => (
          <section key={d.slug} className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-charcoal-900">
                <Link href={`/d/${d.slug}`} className="hover:text-forest-700">
                  {d.name}
                </Link>
              </h2>
              <Link href={`/d/${d.slug}`} className="text-sm font-semibold text-forest-700 hover:underline">
                Shop all
              </Link>
            </div>
            {d.description && <p className="mt-1 text-sm text-charcoal-700/70">{d.description}</p>}
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {d.categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/c/${d.slug}/${c.slug}`}
                    className="text-charcoal-700/80 hover:text-forest-700 hover:underline"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
