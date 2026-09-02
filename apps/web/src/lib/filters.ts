import { productFilterSchema, type ProductFilterInput } from '@oasisa2/validation';

type RawParams = Record<string, string | string[] | undefined>;

/** Normalize Next.js searchParams into a validated ProductFilterInput. */
export function parseProductFilter(
  params: RawParams,
  overrides: Partial<ProductFilterInput> = {},
): ProductFilterInput {
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) flat[k] = v[0] ?? '';
    else if (v != null) flat[k] = v;
  }
  // toggle params come through as "1"
  const parsed = productFilterSchema.parse({
    ...flat,
    halalOnly: flat.halalOnly === '1' || undefined,
    inStockOnly: flat.inStockOnly === '1' || undefined,
    onSaleOnly: flat.onSaleOnly === '1' || undefined,
  });
  return { ...parsed, ...overrides };
}
