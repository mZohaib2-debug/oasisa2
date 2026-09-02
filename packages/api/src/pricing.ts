import { getEffectivePrice, type EffectivePrice, type PromotionRule } from '@oasisa2/commerce';
import { prisma, type Prisma } from '@oasisa2/database';
import type { UnitType } from '@oasisa2/types';

const storePriceInclude = {
  prices: true,
} satisfies Prisma.ProductInclude;

/** Resolve the effective price for a product at a store (StorePrice row wins,
 *  else the product defaults). */
export function resolvePrice(
  product: {
    unitType: UnitType;
    basePriceCents: number;
    compareAtPriceCents: number | null;
    pricePerPoundCents: number | null;
    prices: {
      storeId: string;
      priceCents: number;
      salePriceCents: number | null;
      compareAtPriceCents: number | null;
      pricePerPoundCents: number | null;
      saleStartsAt: Date | null;
      saleEndsAt: Date | null;
    }[];
  },
  storeId: string,
  now: Date = new Date(),
): EffectivePrice {
  const row = product.prices.find((p) => p.storeId === storeId);
  return getEffectivePrice(
    row
      ? {
          priceCents: row.priceCents,
          salePriceCents: row.salePriceCents,
          compareAtPriceCents: row.compareAtPriceCents ?? product.compareAtPriceCents,
          pricePerPoundCents: row.pricePerPoundCents ?? product.pricePerPoundCents,
          saleStartsAt: row.saleStartsAt,
          saleEndsAt: row.saleEndsAt,
        }
      : {
          priceCents: product.basePriceCents,
          compareAtPriceCents: product.compareAtPriceCents,
          pricePerPoundCents: product.pricePerPoundCents,
        },
    product.unitType,
    now,
  );
}

export { storePriceInclude };

/** Load every promotion currently active for a store as commerce PromotionRule[]. */
export async function getActivePromotions(storeId: string): Promise<PromotionRule[]> {
  const now = new Date();
  const promos = await prisma.promotion.findMany({
    where: {
      isActive: true,
      OR: [{ storeId: null }, { storeId }],
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    include: { products: true, categories: true },
  });

  return promos.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type as PromotionRule['type'],
    scope: p.scope as PromotionRule['scope'],
    value: p.value,
    bogoBuyQty: p.bogoBuyQty,
    bogoGetQty: p.bogoGetQty,
    minSubtotalCents: p.minSubtotalCents,
    priority: p.priority,
    productIds: p.products.map((x) => x.productId),
    categoryIds: p.categories.map((x) => x.categoryId).filter((x): x is string => Boolean(x)),
    departmentIds: p.categories.map((x) => x.departmentId).filter((x): x is string => Boolean(x)),
  }));
}
