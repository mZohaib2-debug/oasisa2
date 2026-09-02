import {
  quoteDelivery,
  type DeliveryQuote,
} from '@oasisa2/commerce';
import { prisma } from '@oasisa2/database';
import type { FulfillmentType } from '@oasisa2/types';

export interface ResolvedStoreContext {
  store: {
    id: string;
    slug: string;
    name: string;
    shortName: string;
    state: string;
    phone: string | null;
    line1: string;
    city: string;
    postalCode: string;
    pickupEnabled: boolean;
    deliveryEnabled: boolean;
    deliveryFeeCents: number;
    deliveryMinimumCents: number;
    freeDeliveryThresholdCents: number | null;
    pickupPrepMinutes: number;
    deliveryPrepMinutes: number;
  };
  fulfillmentType: FulfillmentType;
  deliveryPostalCode: string | null;
  deliveryQuote: DeliveryQuote | null;
}

export async function listStores() {
  return prisma.store.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
}

export async function resolveStoreContext(input: {
  storeSlug: string;
  fulfillmentType: FulfillmentType;
  deliveryPostalCode?: string | null;
}): Promise<ResolvedStoreContext | null> {
  const store = await prisma.store.findUnique({
    where: { slug: input.storeSlug },
    include: { deliveryZones: true },
  });
  if (!store || !store.isActive) return null;

  let deliveryQuote: DeliveryQuote | null = null;
  const postalCode = input.deliveryPostalCode?.trim() || null;

  if (input.fulfillmentType === 'DELIVERY' && postalCode) {
    deliveryQuote = quoteDelivery(
      postalCode,
      {
        deliveryEnabled: store.deliveryEnabled,
        deliveryFeeCents: store.deliveryFeeCents,
        deliveryMinimumCents: store.deliveryMinimumCents,
        freeDeliveryThresholdCents: store.freeDeliveryThresholdCents,
      },
      store.deliveryZones.map((z) => ({
        name: z.name,
        postalCodes: z.postalCodes,
        isActive: z.isActive,
        deliveryFeeCents: z.deliveryFeeCents,
        deliveryMinimumCents: z.deliveryMinimumCents,
        freeDeliveryThresholdCents: z.freeDeliveryThresholdCents,
        estimatedMinutes: z.estimatedMinutes,
      })),
    );
  }

  return {
    store: {
      id: store.id,
      slug: store.slug,
      name: store.name,
      shortName: store.shortName,
      state: store.state,
      phone: store.phone,
      line1: store.line1,
      city: store.city,
      postalCode: store.postalCode,
      pickupEnabled: store.pickupEnabled,
      deliveryEnabled: store.deliveryEnabled,
      deliveryFeeCents: store.deliveryFeeCents,
      deliveryMinimumCents: store.deliveryMinimumCents,
      freeDeliveryThresholdCents: store.freeDeliveryThresholdCents,
      pickupPrepMinutes: store.pickupPrepMinutes,
      deliveryPrepMinutes: store.deliveryPrepMinutes,
    },
    fulfillmentType: input.fulfillmentType,
    deliveryPostalCode: postalCode,
    deliveryQuote,
  };
}

export async function checkDeliveryEligibility(storeSlug: string, postalCode: string) {
  const ctx = await resolveStoreContext({
    storeSlug,
    fulfillmentType: 'DELIVERY',
    deliveryPostalCode: postalCode,
  });
  return ctx?.deliveryQuote ?? null;
}
