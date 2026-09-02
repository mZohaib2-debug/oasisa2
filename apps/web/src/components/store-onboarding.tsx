'use client';

import { useState, useTransition } from 'react';
import { MapPin, Package, Truck } from 'lucide-react';
import clsx from 'clsx';
import { selectStoreAction } from '@/app/actions';

interface StoreOption {
  slug: string;
  shortName: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
}

export function StoreOnboarding({ stores }: { stores: StoreOption[] }) {
  const [fulfillment, setFulfillment] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [storeSlug, setStoreSlug] = useState(stores[0]?.slug ?? '');
  const [zip, setZip] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await selectStoreAction(formData);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-forest-950/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-forest-700 text-xl font-black text-white">
          O
        </span>
        <h1 className="mt-3 text-xl font-black text-charcoal-900">Welcome to OasisA2</h1>
        <p className="mt-1 text-sm text-charcoal-700/70">
          Choose how you&apos;d like to shop and which branch you&apos;re shopping from. You can
          change this anytime.
        </p>

        <form action={submit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['PICKUP', 'DELIVERY'] as const).map((f) => (
              <label
                key={f}
                className={clsx(
                  'flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 px-3 py-3 text-sm font-semibold',
                  fulfillment === f
                    ? 'border-forest-600 bg-forest-50 text-forest-800'
                    : 'border-charcoal-700/15 text-charcoal-700',
                )}
              >
                <input
                  type="radio"
                  name="fulfillmentType"
                  value={f}
                  checked={fulfillment === f}
                  onChange={() => setFulfillment(f)}
                  className="sr-only"
                />
                {f === 'PICKUP' ? <Package className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                {f === 'PICKUP' ? 'Store Pickup' : 'Local Delivery'}
              </label>
            ))}
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-charcoal-900">Choose your store</legend>
            {stores.map((s) => {
              const disabled = fulfillment === 'PICKUP' ? !s.pickupEnabled : !s.deliveryEnabled;
              return (
                <label
                  key={s.slug}
                  className={clsx(
                    'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm',
                    storeSlug === s.slug ? 'border-forest-600 bg-forest-50' : 'border-charcoal-700/15',
                    disabled && 'cursor-not-allowed opacity-40',
                  )}
                >
                  <input
                    type="radio"
                    name="storeSlug"
                    value={s.slug}
                    checked={storeSlug === s.slug}
                    disabled={disabled}
                    onChange={() => setStoreSlug(s.slug)}
                    className="h-4 w-4 accent-forest-600"
                  />
                  <MapPin className="h-4 w-4 text-forest-700" />
                  <span className="font-semibold text-charcoal-900">{s.shortName}</span>
                </label>
              );
            })}
          </fieldset>

          {fulfillment === 'DELIVERY' && (
            <div>
              <label htmlFor="ob-zip" className="text-sm font-semibold text-charcoal-900">
                Delivery ZIP code
              </label>
              <input
                id="ob-zip"
                name="deliveryPostalCode"
                inputMode="numeric"
                placeholder="e.g. 21061"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="field mt-1"
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? 'Checking…' : 'Start shopping'}
          </button>
        </form>
      </div>
    </div>
  );
}
