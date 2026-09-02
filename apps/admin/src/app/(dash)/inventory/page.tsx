import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { getStoreScope } from '@/lib/store-scope';
import { inventoryReport } from '@/server/inventory';
import { InventoryAdjustForm } from '@/components/inventory-adjust-form';
import { Badge } from '@/components/stat-card';
import { inventoryTone, statusLabel } from '@/lib/format';

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function InventoryPage({ searchParams }: Props) {
  await requireRole(['STORE_MANAGER']);
  const sp = await searchParams;
  const scope = await getStoreScope();
  const { rows, lowOrOutCount } = await inventoryReport(scope.storeId, sp.q);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ink-900">Inventory — {scope.shortName}</h1>
      <p className="text-sm text-ink-500">
        {rows.length} tracked SKUs · <strong className="text-amber-700">{lowOrOutCount}</strong> low or
        out of stock (shown first)
      </p>

      <form action="/inventory" className="flex gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Search product / SKU" className="field max-w-xs" />
        <button className="btn-secondary" type="submit">
          Search
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-ink-200 bg-ink-50">
            <tr>
              <th className="th">Product</th>
              <th className="th">State</th>
              <th className="th">On hand</th>
              <th className="th">Reserved</th>
              <th className="th">Adjust</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-ink-100 last:border-0 align-middle">
                <td className="td">
                  <Link href={`/products/${r.product.id}`} className="font-semibold text-forest-700">
                    {r.product.name}
                  </Link>
                  <span className="ml-1 text-xs text-ink-400">
                    {r.product.sku} · {r.product.unitType === 'WEIGHT' ? 'by lb' : 'each'}
                    {r.aisle ? ` · aisle ${r.aisle}` : ''}
                  </span>
                </td>
                <td className="td">
                  <Badge tone={inventoryTone(r.state)}>{statusLabel(r.state)}</Badge>
                </td>
                <td className="td font-semibold">{r.quantityOnHand}</td>
                <td className="td text-ink-500">{r.quantityReserved}</td>
                <td className="td">
                  <InventoryAdjustForm
                    storeId={scope.storeId}
                    productId={r.product.id}
                    current={r.quantityOnHand}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
