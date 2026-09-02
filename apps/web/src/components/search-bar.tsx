'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { formatCents } from '@/lib/format';

interface Suggestions {
  products: { id: string; slug: string; name: string; unitPriceCents: number; unitType: string }[];
  categories: { slug: string; name: string; department: { slug: string } }[];
  brands: { slug: string; name: string }[];
}

export function SearchBar({ initialQuery = '' }: { initialQuery?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [sug, setSug] = useState<Suggestions | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setSug(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&suggest=1`);
        if (res.ok) {
          setSug(await res.json());
          setOpen(true);
        }
      } catch {
        /* ignore */
      }
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  function go(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={go} role="search">
        <div className="flex items-center gap-2 rounded-lg border border-forest-200 bg-white px-3 py-2.5 focus-within:border-forest-500 focus-within:ring-2 focus-within:ring-forest-500/20">
          <Search className="h-4 w-4 shrink-0 text-charcoal-700/50" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => sug && setOpen(true)}
            placeholder="Search meat, rice, spices, vegetables…"
            aria-label="Search products"
            className="w-full bg-transparent text-sm outline-none placeholder:text-charcoal-700/45"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label="Clear search">
              <X className="h-4 w-4 text-charcoal-700/40" />
            </button>
          )}
        </div>
      </form>

      {open && sug && (sug.products.length > 0 || sug.categories.length > 0 || sug.brands.length > 0) && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-charcoal-700/10 bg-white shadow-card">
          {sug.categories.length > 0 && (
            <div className="border-b border-charcoal-700/5 p-2">
              {sug.categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/c/${c.department.slug}/${c.slug}`}
                  onClick={() => setOpen(false)}
                  className="block rounded px-2 py-1.5 text-sm hover:bg-forest-50"
                >
                  <span className="text-charcoal-700/60">Category · </span>
                  {c.name}
                </Link>
              ))}
            </div>
          )}
          {sug.products.map((p) => (
            <Link
              key={p.id}
              href={`/p/${p.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-sm hover:bg-forest-50"
            >
              <span className="truncate">{p.name}</span>
              <span className="ml-2 shrink-0 font-semibold text-forest-700">
                {formatCents(p.unitPriceCents)}
                {p.unitType === 'WEIGHT' ? '/lb' : ''}
              </span>
            </Link>
          ))}
          <button
            type="button"
            onMouseDown={() => router.push(`/search?q=${encodeURIComponent(q.trim())}`)}
            className="block w-full border-t border-charcoal-700/5 px-3 py-2 text-left text-sm font-semibold text-forest-700 hover:bg-forest-50"
          >
            See all results for “{q.trim()}”
          </button>
        </div>
      )}
    </div>
  );
}
