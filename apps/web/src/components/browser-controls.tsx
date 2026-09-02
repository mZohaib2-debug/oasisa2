'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SORT_LABELS, type SortKey } from '@oasisa2/commerce';
import clsx from 'clsx';

const TOGGLES: { key: string; label: string }[] = [
  { key: 'inStockOnly', label: 'In stock' },
  { key: 'onSaleOnly', label: 'On sale' },
  { key: 'halalOnly', label: 'Halal only' },
];

export function BrowserControls({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
    next.delete('page');
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-sm text-charcoal-700/60">{total} items</span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {TOGGLES.map((t) => {
          const active = params.get(t.key) === '1';
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setParam(t.key, active ? null : '1')}
              className={clsx(
                'rounded-full border px-3 py-1.5 text-xs font-semibold',
                active
                  ? 'border-forest-600 bg-forest-50 text-forest-800'
                  : 'border-charcoal-700/15 text-charcoal-700/80 hover:bg-forest-50',
              )}
              aria-pressed={active}
            >
              {t.label}
            </button>
          );
        })}
        <label className="flex items-center gap-1.5 text-xs font-semibold text-charcoal-700/80">
          Sort
          <select
            className="field w-auto py-1.5 text-xs"
            value={params.get('sort') ?? 'recommended'}
            onChange={(e) => setParam('sort', e.target.value)}
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export function SubcategoryChips({
  department,
  category,
  subcategories,
  active,
}: {
  department: string;
  category: string;
  subcategories: { slug: string; name: string }[];
  active?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  if (subcategories.length === 0) return null;

  function go(slug: string | null) {
    const next = new URLSearchParams(params.toString());
    if (slug) next.set('subcategory', slug);
    else next.delete('subcategory');
    next.delete('page');
    router.push(`/c/${department}/${category}?${next.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => go(null)}
        className={clsx(
          'rounded-full border px-3 py-1.5 text-xs font-semibold',
          !active ? 'border-forest-600 bg-forest-50 text-forest-800' : 'border-charcoal-700/15',
        )}
      >
        All
      </button>
      {subcategories.map((s) => (
        <button
          key={s.slug}
          type="button"
          onClick={() => go(s.slug)}
          className={clsx(
            'rounded-full border px-3 py-1.5 text-xs font-semibold',
            active === s.slug
              ? 'border-forest-600 bg-forest-50 text-forest-800'
              : 'border-charcoal-700/15 hover:bg-forest-50',
          )}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  if (totalPages <= 1) return null;

  function goto(p: number) {
    const next = new URLSearchParams(params.toString());
    next.set('page', String(p));
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => goto(page - 1)}
        className="btn-secondary px-3 py-1.5 text-xs"
      >
        Previous
      </button>
      <span className="text-sm text-charcoal-700/70">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => goto(page + 1)}
        className="btn-secondary px-3 py-1.5 text-xs"
      >
        Next
      </button>
    </div>
  );
}
