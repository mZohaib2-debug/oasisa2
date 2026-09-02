import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getStoreAdmin } from '@/server/stores';
import { ActionForm, Field, Select, Toggle } from '@/components/action-form';
import { HoursEditor } from '@/components/hours-editor';
import { ActionButton } from '@/components/ui';
import { RegenerateSlotsButton } from '@/components/regenerate-slots-button';
import {
  deleteZoneAction,
  updateStoreAction,
  upsertNoticeAction,
  upsertZoneAction,
} from '@/app/actions';
import { centsToInput } from '@/lib/format';

type Props = { params: Promise<{ slug: string }> };

export default async function StoreDetailPage({ params }: Props) {
  await requireRole(['STORE_MANAGER']);
  const { slug } = await params;
  const store = await getStoreAdmin(slug);
  if (!store) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link href="/stores" className="text-sm text-forest-700">
          ← Stores
        </Link>
        <h1 className="mt-1 text-xl font-bold text-ink-900">{store.name}</h1>
        <p className="text-sm text-ink-500">
          {store._count.orders} orders · {store._count.fulfillmentSlots} slots
        </p>
      </div>

      <section className="card p-4">
        <h2 className="mb-3 font-bold text-ink-900">Location &amp; contact</h2>
        <ActionForm action={updateStoreAction.bind(null, slug)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Phone" name="phone" defaultValue={store.phone} placeholder="(000) 000-0000" />
            <Field label="Email" name="email" defaultValue={store.email} />
            <Field label="Address line 1" name="line1" defaultValue={store.line1.startsWith('TBD') ? '' : store.line1} />
            <Field label="Address line 2" name="line2" defaultValue={store.line2} />
            <Field label="City" name="city" defaultValue={store.city.startsWith('TBD') ? '' : store.city} />
            <Field label="State" name="state" defaultValue={store.state} />
            <Field label="ZIP" name="postalCode" defaultValue={store.postalCode.startsWith('TBD') ? '' : store.postalCode} />
          </div>
        </ActionForm>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-bold text-ink-900">Fulfilment &amp; delivery economics</h2>
        <ActionForm action={updateStoreAction.bind(null, slug)}>
          {/* re-submit location fields as their current values so update doesn't wipe them */}
          <input type="hidden" name="phone" value={store.phone ?? ''} />
          <input type="hidden" name="email" value={store.email ?? ''} />
          <input type="hidden" name="line1" value={store.line1} />
          <input type="hidden" name="line2" value={store.line2 ?? ''} />
          <input type="hidden" name="city" value={store.city} />
          <input type="hidden" name="state" value={store.state} />
          <input type="hidden" name="postalCode" value={store.postalCode} />
          <div className="flex flex-wrap gap-4">
            <Toggle label="Pickup enabled" name="pickupEnabled" defaultChecked={store.pickupEnabled} />
            <Toggle label="Delivery enabled" name="deliveryEnabled" defaultChecked={store.deliveryEnabled} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Pickup prep (minutes)" name="pickupPrepMinutes" type="number" defaultValue={store.pickupPrepMinutes} />
            <Field label="Delivery prep (minutes)" name="deliveryPrepMinutes" type="number" defaultValue={store.deliveryPrepMinutes} />
            <Field label="Delivery fee ($)" name="deliveryFeeCents" type="number" step="0.01" defaultValue={centsToInput(store.deliveryFeeCents)} />
            <Field label="Delivery minimum ($)" name="deliveryMinimumCents" type="number" step="0.01" defaultValue={centsToInput(store.deliveryMinimumCents)} />
            <Field label="Free delivery over ($)" name="freeDeliveryThresholdCents" type="number" step="0.01" defaultValue={centsToInput(store.freeDeliveryThresholdCents)} hint="Blank = never free" />
          </div>
        </ActionForm>
        <div className="mt-3 border-t border-ink-100 pt-3">
          <RegenerateSlotsButton storeId={store.id} />
          <p className="mt-1 text-xs text-ink-400">
            Rebuilds pickup + delivery time slots for the next 7 days from the hours below.
          </p>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-bold text-ink-900">Opening hours</h2>
        <HoursEditor
          slug={slug}
          hours={store.hours.map((h) => ({
            dayOfWeek: h.dayOfWeek,
            opensAt: h.opensAt,
            closesAt: h.closesAt,
            isClosed: h.isClosed,
          }))}
        />
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-bold text-ink-900">Delivery zones</h2>
        <div className="space-y-3">
          {store.deliveryZones.map((z) => (
            <div key={z.id} className="rounded-lg border border-ink-200 p-3">
              <ActionForm action={upsertZoneAction.bind(null, slug)} submitLabel="Save zone">
                <input type="hidden" name="id" value={z.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Zone name" name="name" defaultValue={z.name} />
                  <Field
                    label="ZIP codes (comma/space separated)"
                    name="postalCodes"
                    defaultValue={z.postalCodes.join(', ')}
                  />
                  <Field label="Fee override ($)" name="deliveryFeeCents" type="number" step="0.01" defaultValue={centsToInput(z.deliveryFeeCents)} />
                  <Field label="Minimum override ($)" name="deliveryMinimumCents" type="number" step="0.01" defaultValue={centsToInput(z.deliveryMinimumCents)} />
                  <Field label="Free-delivery override ($)" name="freeDeliveryThresholdCents" type="number" step="0.01" defaultValue={centsToInput(z.freeDeliveryThresholdCents)} />
                </div>
                <Toggle label="Active" name="isActive" defaultChecked={z.isActive} />
              </ActionForm>
              <div className="mt-2">
                <ActionButton
                  action={deleteZoneAction.bind(null, slug, z.id)}
                  className="btn-danger"
                  confirm={`Delete zone "${z.name}"?`}
                >
                  Delete zone
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-dashed border-ink-300 p-3">
          <p className="mb-2 text-sm font-semibold text-ink-700">Add a zone</p>
          <ActionForm action={upsertZoneAction.bind(null, slug)} submitLabel="Add zone" resetOnSuccess>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Zone name" name="name" required />
              <Field label="ZIP codes" name="postalCodes" placeholder="21060, 21061, 21225" />
            </div>
            <Toggle label="Active" name="isActive" defaultChecked />
          </ActionForm>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-bold text-ink-900">Store notices</h2>
        <div className="space-y-3">
          {store.notices.map((n) => (
            <ActionForm key={n.id} action={upsertNoticeAction.bind(null, slug)} submitLabel="Save notice">
              <input type="hidden" name="id" value={n.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Title" name="title" defaultValue={n.title} />
                <Select
                  label="Level"
                  name="level"
                  defaultValue={n.level}
                  options={[
                    { value: 'info', label: 'Info' },
                    { value: 'warning', label: 'Warning' },
                    { value: 'success', label: 'Success' },
                  ]}
                />
              </div>
              <Field label="Body" name="body" defaultValue={n.body} />
              <Toggle label="Active" name="isActive" defaultChecked={n.isActive} />
            </ActionForm>
          ))}
          <div className="rounded-lg border border-dashed border-ink-300 p-3">
            <p className="mb-2 text-sm font-semibold text-ink-700">Add a notice</p>
            <ActionForm action={upsertNoticeAction.bind(null, slug)} submitLabel="Add notice" resetOnSuccess>
              <Field label="Title" name="title" required />
              <Field label="Body" name="body" />
              <Toggle label="Active" name="isActive" defaultChecked />
            </ActionForm>
          </div>
        </div>
      </section>
    </div>
  );
}
