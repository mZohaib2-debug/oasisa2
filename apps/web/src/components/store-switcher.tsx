'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, MapPin, Package, Truck, X } from 'lucide-react';
import clsx from 'clsx';
import { selectStoreAction } from '@/app/actions';

interface StoreOption {
  slug: string;
  shortName: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
}

export function StoreSwitcher({
  stores,
  current,
  compact,
}: {
  stores: StoreOption[];
  current: { storeSlug: string; storeName: string; fulfillmentType: 'PICKUP' | 'DELIVERY'; postalCode?: string | null; chosen: boolean };
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [storeSlug, setStoreSlug] = useState(current.storeSlug);
  const [fulfillment, setFulfillment] = useState<'PICKUP' | 'DELIVERY'>(current.fulfillmentType);
  const [zip, setZip] = useState(current.postalCode ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await selectStoreAction(formData);
      if (res.ok) {
        setOpen(false);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={clsx(
          'flex items-center gap-2 rounded-lg border border-forest-200 bg-white px-3 py-2 text-left text-sm hover:bg-forest-50',
          compact && 'py-1.5',
        )}
      >
        {current.fulfillmentType === 'DELIVERY' ? (
          <Truck className="h-4 w-4 shrink-0 text-forest-700" />
        ) : (
          <Package className="h-4 w-4 shrink-0 text-forest-700" />
        )}
        <span className="min-w-0">
          <span className="block text-[11px] font-medium text-charcoal-700/60">
            {current.fulfillmentType === 'DELIVERY' ? 'Delivery from' : 'Pickup at'}
          </span>
          <span className="block truncate font-semibold text-charcoal-900">
            {current.storeName}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-charcoal-700/50" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal-900/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-charcoal-900">How would you like to shop?</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-charcoal-700/60" />
              </button>
            </div>

            <form action={submit} className="space-y-4">
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
                    {f === 'PICKUP' ? 'Pickup' : 'Delivery'}
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
                        storeSlug === s.slug
                          ? 'border-forest-600 bg-forest-50'
                          : 'border-charcoal-700/15',
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
                  <label htmlFor="zip" className="text-sm font-semibold text-charcoal-900">
                    Delivery ZIP code
                  </label>
                  <input
                    id="zip"
                    name="deliveryPostalCode"
                    inputMode="numeric"
                    placeholder="e.g. 21061"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="field mt-1"
                  />
                  <p className="mt-1 text-xs text-charcoal-700/60">
                    We&apos;ll check whether this branch delivers to you.
                  </p>
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
      )}
    </>
  );
}
