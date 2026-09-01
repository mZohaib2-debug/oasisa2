import { SEARCH_SYNONYMS } from '@oasisa2/config';

/** Query expansion for search. Turns "atta" into ["atta","flour","wheat flour","chakki"]
 *  so the DB / index query matches South Asian grocery terminology. */
export function expandQuery(raw: string): string[] {
  const query = raw.trim().toLowerCase();
  if (!query) return [];
  const tokens = query.split(/\s+/).filter(Boolean);
  const terms = new Set<string>([query, ...tokens]);
  for (const token of tokens) {
    for (const syn of SEARCH_SYNONYMS[token] ?? []) terms.add(syn);
  }
  // whole-phrase synonym (e.g. "lal mirch")
  for (const syn of SEARCH_SYNONYMS[query] ?? []) terms.add(syn);
  return [...terms];
}

export type SortKey = 'recommended' | 'popular' | 'price_asc' | 'price_desc' | 'newest';

export const SORT_LABELS: Record<SortKey, string> = {
  recommended: 'Recommended',
  popular: 'Popular',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  newest: 'Newest',
};
