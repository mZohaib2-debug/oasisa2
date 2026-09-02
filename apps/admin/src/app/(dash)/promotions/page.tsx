import { requireRole } from '@/lib/auth';
import { listPromotionsAdmin } from '@/server/promotions';
import { listStoresAdmin } from '@/server/stores';
import { catalogTaxonomy } from '@/server/catalog';
import { ActionForm, Field, Select, Toggle } from '@/components/action-form';
import { ActionButton } from '@/components/ui';
import { togglePromotionAction, upsertPromotionAction } from '@/app/actions';
import { formatCents } from '@/lib/format';

export default async function PromotionsPage() {
  await requireRole(['STORE_MANAGER']);
  const [promos, stores, taxonomy] = await Promise.all([
    listPromotionsAdmin(),
    listStoresAdmin(),
    catalogTaxonomy(),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        <h1 className="text-xl font-bold text-ink-900">Promotions</h1>
        {promos.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink-900">{p.name}</p>
                <p className="text-xs text-ink-500">
                  {p.type.replace('_', ' ').toLowerCase()} · scope {p.scope.toLowerCase()} ·{' '}
                  {p.type === 'PERCENT_OFF' ? `${p.value / 100}%` : formatCents(p.value)}
                  {p.minSubtotalCents ? ` · min ${formatCents(p.minSubtotalCents)}` : ''}
                  {p.store ? ` · ${p.store.shortName} only` : ' · all stores'}
                  {p.isFeatured ? ' · featured' : ''}
                </p>
                {p.description && <p className="text-xs text-ink-400">{p.description}</p>}
                <p className="text-xs text-ink-400">
                  {p._count.products} product targets · {p._count.categories} category/department targets
                </p>
              </div>
              <ActionButton
                action={togglePromotionAction.bind(null, p.id, !p.isActive)}
                className={p.isActive ? 'btn bg-forest-600 text-white' : 'btn-secondary'}
              >
                {p.isActive ? 'Active' : 'Inactive'}
              </ActionButton>
            </div>
          </div>
        ))}
      </div>

      <div className="card h-fit p-4">
        <h2 className="mb-3 font-bold text-ink-900">New promotion</h2>
        <ActionForm action={upsertPromotionAction} submitLabel="Create" resetOnSuccess>
          <Field label="Name" name="name" required />
          <Field label="Description" name="description" />
          <Select
            label="Type"
            name="type"
            defaultValue="PERCENT_OFF"
            options={[
              { value: 'PERCENT_OFF', label: 'Percent off' },
              { value: 'AMOUNT_OFF', label: 'Amount off' },
              { value: 'FIXED_PRICE', label: 'Fixed price' },
              { value: 'BOGO', label: 'Buy one get one' },
            ]}
          />
          <Field label="Value (% or $)" name="value" type="number" step="0.01" required hint="10 = 10% or $10 depending on type" />
          <Select
            label="Scope"
            name="scope"
            defaultValue="ORDER"
            options={[
              { value: 'ORDER', label: 'Whole order' },
              { value: 'PRODUCT', label: 'Specific product' },
              { value: 'CATEGORY', label: 'Category' },
              { value: 'DEPARTMENT', label: 'Department' },
            ]}
          />
          <Select
            label="Target (for product/category/department scope)"
            name="targetType"
            defaultValue=""
            options={[
              { value: '', label: 'None (order scope)' },
              { value: 'category', label: 'Category' },
              { value: 'department', label: 'Department' },
            ]}
          />
          <Select
            label="Category / department"
            name="targetId"
            defaultValue=""
            options={[
              { value: '', label: '—' },
              ...taxonomy.map((d) => ({ value: d.id, label: `Dept: ${d.name}` })),
              ...taxonomy.flatMap((d) =>
                d.categories.map((c) => ({ value: c.id, label: `Cat: ${d.name} › ${c.name}` })),
              ),
            ]}
          />
          <Field label="Min subtotal ($)" name="minSubtotalCents" type="number" step="0.01" />
          <Field label="Priority" name="priority" type="number" defaultValue={0} />
          <Select
            label="Store"
            name="storeId"
            defaultValue=""
            options={[
              { value: '', label: 'All stores' },
              ...stores.map((s) => ({ value: s.id, label: s.shortName })),
            ]}
          />
          <div className="flex gap-4">
            <Toggle label="Active" name="isActive" defaultChecked />
            <Toggle label="Featured (Weekly Specials)" name="isFeatured" />
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
