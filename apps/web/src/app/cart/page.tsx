import type { Metadata } from 'next';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { ProductImage } from '@/components/product-image';
import { OrderSummary } from '@/components/order-summary';
import { CartQuantityControls } from '@/components/cart-line-controls';
import { CouponForm } from '@/components/coupon-form';
import { getActiveCartView } from '@/lib/cart';
import { getStoreContext } from '@/lib/store-context';
import { butcherSummary, formatCents } from '@/lib/format';

export const metadata: Metadata = { title: 'Your Cart', robots: { index: false } };

const SUB_LABEL: Record<string, string> = {
  BEST_SUBSTITUTE: 'Best substitute',
  CONTACT_ME: 'Contact me',
  DO_NOT_SUBSTITUTE: 'No substitution',
};

export default async function CartPage() {
  const [view, ctx] = await Promise.all([getActiveCartView(), getStoreContext()]);

  if (!view || view.lines.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <ShoppingCart className="mx-auto h-10 w-10 text-charcoal-700/30" />
        <h1 className="mt-3 text-xl font-black text-charcoal-900">Your cart is empty</h1>
        <p className="mt-1 text-sm text-charcoal-700/70">
          Add some fresh halal groceries to get started.
        </p>
        <Link href="/departments" className="btn-primary mt-4">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-charcoal-900">Your Cart</h1>
      <p className="mt-1 text-sm text-charcoal-700/70">
        {ctx.fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Pickup'} · {ctx.store.shortName}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {view.lines.map((line) => {
            const butcher = butcherSummary(line.butcherSelections);
            return (
              <div key={line.id} className="card flex gap-3 p-3">
                <Link href={`/p/${line.slug}`}>
                  <ProductImage name={line.name} className="h-20 w-20 shrink-0" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {line.brandName && (
                        <span className="text-[11px] font-semibold uppercase text-charcoal-700/50">
                          {line.brandName}
                        </span>
                      )}
                      <Link href={`/p/${line.slug}`} className="block text-sm font-semibold text-charcoal-900 hover:text-forest-700">
                        {line.name}
                      </Link>
                      <p className="text-xs text-charcoal-700/60">
                        {line.variantName ? `${line.variantName} · ` : ''}
                        {line.unitType === 'WEIGHT'
                          ? `~${line.requestedWeightLb} lb @ ${formatCents(line.unitPriceCents)}/lb`
                          : `${formatCents(line.unitPriceCents)} each`}
                      </p>
                      {butcher && (
                        <p className="mt-0.5 text-xs text-forest-700">Butcher: {butcher}</p>
                      )}
                      {line.butcherNotes && (
                        <p className="text-xs italic text-charcoal-700/60">“{line.butcherNotes}”</p>
                      )}
                      <p className="mt-0.5 text-xs text-charcoal-700/55">
                        If unavailable: {SUB_LABEL[line.substitution] ?? line.substitution}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-sm font-bold text-charcoal-900">
                      {formatCents(
                        view.totals.lines.find((l) => l.lineId === line.id)?.netLineCents ?? 0,
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <CartQuantityControls
                      cartItemId={line.id}
                      quantity={line.quantity}
                      unitType={line.unitType}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <CouponForm current={view.couponCode} />
          <OrderSummary totals={view.totals} fulfillmentType={ctx.fulfillmentType}>
            <Link
              href="/checkout"
              aria-disabled={ctx.fulfillmentType === 'DELIVERY' && !view.totals.meetsDeliveryMinimum}
              className="btn-primary w-full"
            >
              Proceed to checkout
            </Link>
            <Link href="/departments" className="btn-ghost mt-2 w-full">
              Continue shopping
            </Link>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
