import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@oasisa2/database';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Rendered per request — never queries the database during `next build`.
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return {};
    return {
      title: `${store.name} — Hours & Info`,
      description: `Visit OasisA2 ${store.shortName}: halal groceries, fresh butcher service, pickup and local delivery.`,
    };
  } catch {
    return {};
  }
}

export default async function LocationPage({ params }: Props) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug },
    include: { hours: { orderBy: { dayOfWeek: 'asc' } }, deliveryZones: true, notices: { where: { isActive: true } } },
  });
  if (!store) notFound();

  const addressKnown = !store.line1.startsWith('TBD') && store.postalCode !== 'TBD';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GroceryStore',
    name: store.name,
    telephone: store.phone ?? undefined,
    address: addressKnown
      ? {
          '@type': 'PostalAddress',
          streetAddress: store.line1,
          addressLocality: store.city,
          addressRegion: store.state,
          postalCode: store.postalCode,
          addressCountry: 'US',
        }
      : undefined,
    priceRange: '$$',
  };

  return (
    <div className="mx-auto max-w-2xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-2xl font-black text-charcoal-900">{store.name}</h1>
      <p className="mt-1 text-sm text-charcoal-700/70">
        100% halal meat · fresh butcher service · Pakistani, Indian, South Asian &amp; Middle
        Eastern groceries.
      </p>

      {store.notices.map((n) => (
        <div key={n.id} className="mt-4 rounded-lg bg-gold-400/15 px-4 py-3 text-sm text-gold-600">
          <strong>{n.title}.</strong> {n.body}
        </div>
      ))}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-charcoal-700/60">Address</h2>
          {addressKnown ? (
            <address className="mt-2 not-italic text-sm text-charcoal-700/85">
              {store.line1}
              {store.line2 && <><br />{store.line2}</>}
              <br />
              {store.city}, {store.state} {store.postalCode}
            </address>
          ) : (
            <p className="mt-2 text-sm text-charcoal-700/60">
              Address to be confirmed by store staff.
            </p>
          )}
          <p className="mt-2 text-sm">
            <span className="font-semibold">Phone:</span>{' '}
            {store.phone ?? <span className="text-charcoal-700/60">To be confirmed</span>}
          </p>
        </section>

        <section className="card p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-charcoal-700/60">Hours</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {store.hours.map((h) => (
              <li key={h.id} className="flex justify-between">
                <span>{DAYS[h.dayOfWeek]}</span>
                <span className="text-charcoal-700/70">
                  {h.isClosed || !h.opensAt ? 'Closed' : `${h.opensAt} – ${h.closesAt}`}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-charcoal-700/50">Hours are placeholders pending confirmation.</p>
        </section>
      </div>

      <section className="card mt-6 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-charcoal-700/60">
          Pickup &amp; delivery
        </h2>
        <ul className="mt-2 space-y-1 text-sm text-charcoal-700/85">
          <li>Pickup: {store.pickupEnabled ? `available (ready in ~${store.pickupPrepMinutes / 60} hr)` : 'unavailable'}</li>
          <li>
            Delivery:{' '}
            {store.deliveryEnabled
              ? `$${(store.deliveryFeeCents / 100).toFixed(2)} fee · $${(store.deliveryMinimumCents / 100).toFixed(0)} minimum${
                  store.freeDeliveryThresholdCents
                    ? ` · free over $${(store.freeDeliveryThresholdCents / 100).toFixed(0)}`
                    : ''
                }`
              : 'unavailable'}
          </li>
          {store.deliveryZones.flatMap((z) => z.postalCodes).length > 0 && (
            <li>
              Delivery ZIPs (placeholder):{' '}
              {store.deliveryZones.flatMap((z) => z.postalCodes).join(', ')}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
