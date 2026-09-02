import { requireRole } from '@/lib/auth';
import { listBrandsAdmin } from '@/server/catalog';
import { ActionForm, Field } from '@/components/action-form';
import { createBrandAction } from '@/app/actions';

export default async function BrandsPage() {
  await requireRole(['STORE_MANAGER']);
  const brands = await listBrandsAdmin();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div>
        <h1 className="mb-3 text-xl font-bold text-ink-900">Brands</h1>
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-ink-200 bg-ink-50">
              <tr>
                <th className="th">Brand</th>
                <th className="th">Products</th>
                <th className="th">Source</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id} className="border-b border-ink-100 last:border-0">
                  <td className="td font-medium">{b.name}</td>
                  <td className="td text-ink-500">{b._count.products}</td>
                  <td className="td text-ink-400">{b.isDemo ? 'demo' : 'live'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card h-fit p-4">
        <h2 className="mb-3 font-bold text-ink-900">Add brand</h2>
        <ActionForm action={createBrandAction} submitLabel="Add brand" resetOnSuccess>
          <Field label="Brand name" name="name" required />
        </ActionForm>
      </div>
    </div>
  );
}
