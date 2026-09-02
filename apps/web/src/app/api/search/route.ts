import { NextResponse } from 'next/server';
import { listProducts, searchSuggest } from '@oasisa2/api';
import { productFilterSchema } from '@oasisa2/validation';
import { getStoreContext } from '@/lib/store-context';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ctx = await getStoreContext();
  const q = url.searchParams.get('q') ?? '';

  if (url.searchParams.get('suggest')) {
    const data = await searchSuggest(q, ctx.store.id);
    return NextResponse.json(data);
  }

  const parsed = productFilterSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  }
  const results = await listProducts(parsed.data, ctx.store.id);
  return NextResponse.json(results);
}
