import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { catalogTaxonomy } from '@/server/catalog';
import { ActionForm, Field, Select } from '@/components/action-form';
import { createProductAction } from '@/app/actions';

export default async function NewProductPage() {
  await requireRole(['STORE_MANAGER']);
  const taxonomy = await catalogTaxonomy();

  const categoryOptions = taxonomy.flatMap((d) =>
    d.categories.map((c) => ({ value: c.id, label: `${d.name} › ${c.name}` })),
  );

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/products" className="text-sm text-forest-700">
        ← Products
      </Link>
      <h1 className="text-xl font-bold text-ink-900">New product</h1>
      <div className="card p-4">
        <ActionForm action={createProductAction} submitLabel="Create product">
          <Field label="Name" name="name" required />
          <Field label="SKU" name="sku" required hint="Unique. Uppercased automatically." />
          <Field label="Short description" name="shortDescription" />
          <Field label="Package size" name="packageSize" placeholder="e.g. 5 lb, 400 g, 12 ct" />
          <Select label="Category" name="categoryId" options={[{ value: '', label: 'Select…' }, ...categoryOptions]} />
          <Select
            label="Sold as"
            name="unitType"
            defaultValue="EACH"
            options={[
              { value: 'EACH', label: 'Each / package' },
              { value: 'WEIGHT', label: 'By the pound (weighted)' },
            ]}
          />
          <Field label="Price ($)" name="priceCents" type="number" step="0.01" required hint="Per package, or per lb for weighted items. Applied to all branches; edit per-branch after." />
          <Select
            label="Halal status"
            name="halalStatus"
            defaultValue="NOT_APPLICABLE"
            options={[
              { value: 'NOT_APPLICABLE', label: 'Not applicable' },
              { value: 'HALAL', label: 'Halal' },
              { value: 'HALAL_CERTIFIED', label: 'Halal certified' },
            ]}
          />
          <Select
            label="Tax status"
            name="taxStatus"
            defaultValue="EXEMPT"
            options={[
              { value: 'EXEMPT', label: 'Tax exempt' },
              { value: 'TAXABLE', label: 'Taxable' },
            ]}
          />
          <p className="text-xs text-ink-400">
            The product starts <strong>out of stock</strong> at every branch — set quantities on the
            product page after creating.
          </p>
        </ActionForm>
      </div>
    </div>
  );
}
