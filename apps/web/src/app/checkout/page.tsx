import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAvailableSlots } from '@oasisa2/api';
import { ProductImage } from '@/components/product-image';
import { OrderSummary } from '@/components/order-summary';
import { CheckoutForm } from '@/components/checkout-form';
import { getActiveCartView } from '@/lib/cart';
import { getStoreContext } from '@/lib/store-context';
import { getCurrentUser } from '@/lib/session';
import { formatCents } from '@/lib/format';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };

export default async function CheckoutPage() {
  const [view, ctx, user] = await Promise.all([
    getActiveCartView(),
    getStoreContext(),
    getCurrentUser(),
  ]);

  if (!view || view.lines.length === 0) redirect('/cart');

  const slotDays = await getAvailableSlots(ctx.store.id, ctx.fulfillmentType);

  const canPlace =
    ctx.fulfillmentType === 'PICKUP' ||
    (view.totals.deliveryEligible && view.totals.meetsDeliveryMinimum);

  return (
    <div>
      <h1 className="text-2xl font-black text-charcoal-900">Checkout</h1>
      <p className="mt-1 text-sm text-charcoal-700/70">
        {ctx.fulfillmentType === 'DELIVERY'
          ? `Delivery from ${ctx.store.shortName}`
          : `Pickup at ${ctx.store.shortName}`}
        {ctx.store.line1 && !ctx.store.line1.startsWith('TBD') ? ` · ${ctx.store.line1}` : ''}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <CheckoutForm
          fulfillmentType={ctx.fulfillmentType}
          storeState={ctx.store.state}
          slotDays={slotDays}
          canPlace={canPlace}
          prefill={{
            name: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : '',
            email: user?.email ?? '',
            phone: '',
            loggedIn: Boolean(user),
          }}
        />

        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-charcoal-700/60">
              {view.lines.length} items
            </h2>
            <ul className="mt-2 space-y-2">
              {view.lines.map((l) => (
                <li key={l.id} className="flex items-center gap-2 text-sm">
                  <ProductImage name={l.name} className="h-10 w-10 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">
                    {l.name}
                    <span className="text-charcoal-700/50">
                      {' '}
                      · {l.unitType === 'WEIGHT' ? `~${l.requestedWeightLb} lb` : `×${l.quantity}`}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold">
                    {formatCents(
                      view.totals.lines.find((t) => t.lineId === l.id)?.netLineCents ?? 0,
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/cart" className="mt-2 inline-block text-xs font-semibold text-forest-700 hover:underline">
              Edit cart
            </Link>
          </div>
          <OrderSummary totals={view.totals} fulfillmentType={ctx.fulfillmentType} />
        </div>
      </div>
    </div>
  );
}
