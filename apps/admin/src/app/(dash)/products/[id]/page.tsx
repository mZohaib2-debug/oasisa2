import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getProductAdmin } from '@/server/catalog';
import { ActionForm, Field, Select, Toggle } from '@/components/action-form';
import { InventoryAdjustForm } from '@/components/inventory-adjust-form';
import {
  setStorePriceAction,
  updateProductAction,
  toggleHoldAction,
} from '@/app/actions';
import { ActionButton } from '@/components/ui';
import { centsToInput, formatCents, statusLabel } from '@/lib/format';

type Props = { params: Promise<{ id: string }> };

export default async function ProductEditPage({ params }: Props) {
  await requireRole(['STORE_MANAGER']);
  const { id } = await params;
  const p = await getProductAdmin(id);
  if (!p) notFound();

  const isWeight = p.unitType === 'WEIGHT';

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link href="/products" className="text-sm text-forest-700">
          ← Products
        </Link>
        <h1 className="mt-1 text-xl font-bold text-ink-900">{p.name}</h1>
        <p className="text-sm text-ink-500">
          {p.sku} · {p.department.name} / {p.category.name}
          {p.subcategory ? ` / ${p.subcategory.name}` : ''} ·{' '}
          {isWeight ? 'sold by the pound' : 'sold each'}
          {p.isDemo ? ' · demo item' : ''}
        </p>
      </div>

      <section className="card p-4">
        <h2 className="mb-3 font-bold text-ink-900">Product details</h2>
        <ActionForm action={updateProductAction.bind(null, p.id)}>
          <Field label="Name" name="name" defaultValue={p.name} required />
          <Field label="Short description" name="shortDescription" defaultValue={p.shortDescription} />
          <label className="block">
            <span className="label">Description</span>
            <textarea name="description" defaultValue={p.description ?? ''} rows={3} className="field mt-1" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Package size" name="packageSize" defaultValue={p.packageSize} />
            <Field label="Country of origin" name="countryOfOrigin" defaultValue={p.countryOfOrigin} />
            <Field
              label={isWeight ? 'Default price / lb ($)' : 'Default price ($)'}
              name={isWeight ? 'pricePerPoundCents' : 'basePriceCents'}
              type="number"
              step="0.01"
              defaultValue={centsToInput(isWeight ? p.pricePerPoundCents : p.basePriceCents)}
              hint="Per-store price below overrides this on the storefront."
            />
            <Field
              label="Compare-at price ($)"
              name="compareAtPriceCents"
              type="number"
              step="0.01"
              defaultValue={centsToInput(p.compareAtPriceCents)}
            />
            <Select
              label="Halal status"
              name="halalStatus"
              defaultValue={p.halalStatus}
              options={[
                { value: 'NOT_APPLICABLE', label: 'Not applicable' },
                { value: 'HALAL', label: 'Halal' },
                { value: 'HALAL_CERTIFIED', label: 'Halal certified' },
              ]}
            />
            <Select
              label="Tax status"
              name="taxStatus"
              defaultValue={p.taxStatus}
              options={[
                { value: 'EXEMPT', label: 'Tax exempt' },
                { value: 'TAXABLE', label: 'Taxable' },
              ]}
            />
          </div>
          <label className="block">
            <span className="label">Storage instructions</span>
            <textarea
              name="storageInstructions"
              defaultValue={p.storageInstructions ?? ''}
              rows={2}
              className="field mt-1"
            />
          </label>
          <div className="flex flex-wrap gap-4">
            <Toggle label="Active (visible on storefront)" name="isActive" defaultChecked={p.isActive} />
            <Toggle label="Featured" name="isFeatured" defaultChecked={p.isFeatured} />
            <Toggle label="New arrival" name="isNewArrival" defaultChecked={p.isNewArrival} />
          </div>
        </ActionForm>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-bold text-ink-900">Per-store price &amp; stock</h2>
        <div className="space-y-4">
          {p.inventory.map((inv) => {
            const price = p.prices.find((pr) => pr.storeId === inv.storeId);
            return (
              <div key={inv.storeId} className="rounded-lg border border-ink-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold text-ink-900">{inv.store.shortName}</p>
                  <span className="text-xs text-ink-500">
                    {statusLabel(inv.state)} · on hand {inv.quantityOnHand} · reserved{' '}
                    {inv.quantityReserved}
                  </span>
                </div>
                <ActionForm action={setStorePriceAction} submitLabel="Save price">
                  <input type="hidden" name="storeId" value={inv.storeId} />
                  <input type="hidden" name="productId" value={p.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label={isWeight ? 'Price / lb ($)' : 'Price ($)'}
                      name="priceCents"
                      type="number"
                      step="0.01"
                      defaultValue={centsToInput(
                        isWeight ? (price?.pricePerPoundCents ?? price?.priceCents) : price?.priceCents,
                      )}
                      required
                    />
                    <Field
                      label="Sale price ($) — blank to clear"
                      name="salePriceCents"
                      type="number"
                      step="0.01"
                      defaultValue={centsToInput(price?.salePriceCents)}
                      hint={price?.salePriceCents ? `On sale from ${formatCents(price.priceCents)}` : undefined}
                    />
                  </div>
                </ActionForm>
                <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-ink-100 pt-3">
                  <InventoryAdjustForm
                    storeId={inv.storeId}
                    productId={p.id}
                    current={inv.quantityOnHand}
                  />
                  <ActionButton
                    action={toggleHoldAction.bind(
                      null,
                      inv.storeId,
                      p.id,
                      inv.state !== 'TEMPORARILY_UNAVAILABLE',
                    )}
                    className={inv.state === 'TEMPORARILY_UNAVAILABLE' ? 'btn-secondary' : 'btn bg-amber-500 text-white hover:bg-amber-600'}
                  >
                    {inv.state === 'TEMPORARILY_UNAVAILABLE' ? 'Release hold' : 'Place on hold'}
                  </ActionButton>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {p.butcherOptions.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-2 font-bold text-ink-900">Butcher options</h2>
          <p className="text-sm text-ink-500">
            {p.butcherOptions.length} options across{' '}
            {[...new Set(p.butcherOptions.map((o) => o.group))].join(', ')}. (Managed in seed data.)
          </p>
        </section>
      )}
    </div>
  );
}
