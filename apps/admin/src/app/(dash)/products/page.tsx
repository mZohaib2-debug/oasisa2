import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { getStoreScope } from '@/lib/store-scope';
import { listProductsAdmin, catalogTaxonomy } from '@/server/catalog';
import { Badge } from '@/components/stat-card';
import { formatCents, inventoryTone, statusLabel } from '@/lib/format';

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function ProductsPage({ searchParams }: Props) {
  await requireRole(['STORE_MANAGER']);
  const sp = await searchParams;
  const scope = await getStoreScope();
  const page = Number(sp.page || 1);

  const [{ products, total, totalPages }, taxonomy] = await Promise.all([
    listProductsAdmin({
      q: sp.q,
      departmentSlug: sp.department,
      storeId: scope.storeId,
      onlyIssues: sp.issues === '1',
      page,
    }),
    catalogTaxonomy(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink-900">Products</h1>
        <Link href="/products/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New product
        </Link>
      </div>

      <form className="flex flex-wrap gap-2" action="/products">
        <input name="q" defaultValue={sp.q} placeholder="Name, SKU, barcode" className="field max-w-xs" />
        <select name="department" defaultValue={sp.department ?? ''} className="field w-auto">
          <option value="">All departments</option>
          {taxonomy.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" name="issues" value="1" defaultChecked={sp.issues === '1'} /> Low / out
          of stock only
        </label>
        <button type="submit" className="btn-secondary">
          Filter
        </button>
      </form>

      <p className="text-sm text-ink-500">
        {total} products · prices &amp; stock shown for <strong>{scope.shortName}</strong>
      </p>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-ink-200 bg-ink-50">
            <tr>
              <th className="th">Product</th>
              <th className="th">Department</th>
              <th className="th">Price ({scope.shortName})</th>
              <th className="th">Stock</th>
              <th className="th">Active</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const price = p.prices[0];
              const inv = p.inventory[0];
              const effective = price?.salePriceCents ?? price?.priceCents ?? p.basePriceCents;
              return (
                <tr key={p.id} className="row-link border-b border-ink-100 last:border-0">
                  <td className="td">
                    <Link href={`/products/${p.id}`} className="font-semibold text-forest-700">
                      {p.name}
                    </Link>
                    <span className="ml-1 text-xs text-ink-400">
                      {p.sku} · {p.brand?.name ?? 'no brand'} · {p.unitType === 'WEIGHT' ? 'by lb' : 'each'}
                    </span>
                  </td>
                  <td className="td text-ink-500">{p.department.name}</td>
                  <td className="td">
                    {formatCents(effective)}
                    {p.unitType === 'WEIGHT' ? '/lb' : ''}
                    {price?.salePriceCents ? (
                      <span className="ml-1 text-xs text-ink-400 line-through">
                        {formatCents(price.priceCents)}
                      </span>
                    ) : null}
                  </td>
                  <td className="td">
                    <Badge tone={inventoryTone(inv?.state ?? 'OUT_OF_STOCK')}>
                      {statusLabel(inv?.state ?? 'OUT_OF_STOCK')}
                    </Badge>
                    <span className="ml-1 text-xs text-ink-400">{inv?.quantityOnHand ?? 0}</span>
                  </td>
                  <td className="td">{p.isActive ? '✓' : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={`/products?${new URLSearchParams({ ...sp, page: String(page - 1) } as Record<string, string>)}`} className="btn-secondary">
              Previous
            </Link>
          )}
          <span className="text-ink-500 self-center">Page {page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={`/products?${new URLSearchParams({ ...sp, page: String(page + 1) } as Record<string, string>)}`} className="btn-secondary">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
