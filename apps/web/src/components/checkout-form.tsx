'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { formatCents, formatSlot } from '@/lib/format';
import { checkoutAction } from '@/app/actions';

interface SlotDay {
  date: string;
  slots: { id: string; startTime: string; endTime: string; available: boolean; remaining: number }[];
}

export function CheckoutForm({
  fulfillmentType,
  storeState,
  slotDays,
  prefill,
  canPlace,
}: {
  fulfillmentType: 'PICKUP' | 'DELIVERY';
  storeState: string;
  slotDays: SlotDay[];
  prefill: { name: string; email: string; phone: string; loggedIn: boolean };
  canPlace: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [contactName, setContactName] = useState(prefill.name);
  const [contactEmail, setContactEmail] = useState(prefill.email);
  const [contactPhone, setContactPhone] = useState(prefill.phone);
  const [slotId, setSlotId] = useState<string | null>(
    slotDays.flatMap((d) => d.slots).find((s) => s.available)?.id ?? null,
  );
  const [tip, setTip] = useState(0);
  const [note, setNote] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');

  const [addr, setAddr] = useState({
    recipientName: prefill.name,
    phone: prefill.phone,
    line1: '',
    line2: '',
    city: '',
    state: storeState,
    postalCode: '',
    gateCode: '',
    deliveryInstructions: '',
  });
  const [contactless, setContactless] = useState(false);
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);

  function submit() {
    setError(null);
    if (!slotId) {
      setError('Please choose a time slot.');
      return;
    }
    startTransition(async () => {
      const res = await checkoutAction({
        contactName,
        contactEmail: contactEmail || undefined,
        contactPhone,
        fulfillmentType,
        slotId,
        tipCents: tip,
        customerNote: note || undefined,
        createAccount: createAccount && !prefill.loggedIn,
        password: createAccount ? password : undefined,
        ...(fulfillmentType === 'DELIVERY'
          ? {
              address: {
                recipientName: addr.recipientName,
                phone: addr.phone,
                line1: addr.line1,
                line2: addr.line2 || undefined,
                city: addr.city,
                state: addr.state,
                postalCode: addr.postalCode,
                gateCode: addr.gateCode || undefined,
                deliveryInstructions: addr.deliveryInstructions || undefined,
              },
              contactless,
              leaveAtDoor,
            }
          : {}),
      });
      if (res.ok && res.data && typeof res.data === 'object' && 'orderNumber' in res.data) {
        router.push(`/checkout/confirmation/${(res.data as { orderNumber: string }).orderNumber}`);
      } else if (!res.ok) {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="font-bold text-charcoal-900">Contact</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-charcoal-900">
            Full name
            <input className="field mt-1" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
          </label>
          <label className="text-sm font-semibold text-charcoal-900">
            Phone
            <input className="field mt-1" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required inputMode="tel" />
          </label>
          <label className="text-sm font-semibold text-charcoal-900 sm:col-span-2">
            Email {fulfillmentType === 'PICKUP' && <span className="font-normal text-charcoal-700/50">(for your receipt)</span>}
            <input className="field mt-1" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </label>
        </div>
      </section>

      {fulfillmentType === 'DELIVERY' && (
        <section className="card p-5">
          <h2 className="font-bold text-charcoal-900">Delivery address</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Address line 1" value={addr.line1} onChange={(v) => setAddr({ ...addr, line1: v })} required full />
            <Input label="Apartment / unit" value={addr.line2} onChange={(v) => setAddr({ ...addr, line2: v })} />
            <Input label="Gate code" value={addr.gateCode} onChange={(v) => setAddr({ ...addr, gateCode: v })} />
            <Input label="City" value={addr.city} onChange={(v) => setAddr({ ...addr, city: v })} required />
            <Input label="State" value={addr.state} onChange={(v) => setAddr({ ...addr, state: v.toUpperCase().slice(0, 2) })} required />
            <Input label="ZIP code" value={addr.postalCode} onChange={(v) => setAddr({ ...addr, postalCode: v })} required />
            <label className="text-sm font-semibold text-charcoal-900 sm:col-span-2">
              Delivery instructions
              <textarea className="field mt-1" rows={2} value={addr.deliveryInstructions} onChange={(e) => setAddr({ ...addr, deliveryInstructions: e.target.value })} />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={contactless} onChange={(e) => setContactless(e.target.checked)} /> Contactless delivery
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={leaveAtDoor} onChange={(e) => setLeaveAtDoor(e.target.checked)} /> Leave at door
            </label>
          </div>
        </section>
      )}

      <section className="card p-5">
        <h2 className="font-bold text-charcoal-900">
          {fulfillmentType === 'DELIVERY' ? 'Delivery window' : 'Pickup time'}
        </h2>
        {slotDays.length === 0 ? (
          <p className="mt-2 text-sm text-charcoal-700/70">No slots available. Please try again later.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {slotDays.map((day) => (
              <div key={day.date}>
                <p className="text-xs font-semibold uppercase text-charcoal-700/50">
                  {new Date(`${day.date}T00:00:00`).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {day.slots.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={!s.available}
                      onClick={() => setSlotId(s.id)}
                      className={clsx(
                        'rounded-lg border px-3 py-2 text-xs font-semibold',
                        slotId === s.id
                          ? 'border-forest-600 bg-forest-50 text-forest-800'
                          : 'border-charcoal-700/15 hover:bg-forest-50',
                        !s.available && 'cursor-not-allowed opacity-40',
                      )}
                    >
                      {formatSlot(day.date, s.startTime, s.endTime).split(', ')[1]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="font-bold text-charcoal-900">Tip &amp; notes</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {[0, 300, 500, 800].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTip(t)}
              className={clsx(
                'rounded-lg border px-3 py-2 text-xs font-semibold',
                tip === t ? 'border-forest-600 bg-forest-50 text-forest-800' : 'border-charcoal-700/15',
              )}
            >
              {t === 0 ? 'No tip' : formatCents(t)}
            </button>
          ))}
        </div>
        <textarea
          className="field mt-3"
          rows={2}
          placeholder="Order notes (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </section>

      <section className="card p-5">
        <h2 className="font-bold text-charcoal-900">Payment</h2>
        <p className="mt-1 text-sm text-charcoal-700/70">
          Card payment is processed securely at pickup/delivery confirmation. Stripe is not yet
          connected in this environment, so your order is placed now and payment is collected on
          fulfilment.
        </p>
        {!prefill.loggedIn && (
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={createAccount}
              onChange={(e) => setCreateAccount(e.target.checked)}
              className="mt-1"
            />
            <span>
              Create an account to track this order and reorder faster.
              {createAccount && (
                <input
                  type="password"
                  className="field mt-2"
                  placeholder="Choose a password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </span>
          </label>
        )}
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <button type="button" onClick={submit} disabled={pending || !canPlace} className="btn-primary w-full text-base">
        {pending ? 'Placing order…' : 'Place order'}
      </button>
      {!canPlace && (
        <p className="text-center text-xs text-red-600">
          Your order does not meet the delivery minimum for this branch.
        </p>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <label className={clsx('text-sm font-semibold text-charcoal-900', full && 'sm:col-span-2')}>
      {label}
      {required && <span className="text-red-500"> *</span>}
      <input className="field mt-1" value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </label>
  );
}
