import { UnitType } from '@oasisa2/types';
import { assertCents } from './money';

/** Per-store price record (already resolved from StorePrice, falling back to Product). */
export interface ResolvedStorePrice {
  priceCents: number;
  salePriceCents?: number | null;
  compareAtPriceCents?: number | null;
  pricePerPoundCents?: number | null;
  saleStartsAt?: Date | null;
  saleEndsAt?: Date | null;
}

export interface EffectivePrice {
  unitType: UnitType;
  /** For EACH: price per package. For WEIGHT: price per pound. */
  unitPriceCents: number;
  /** The pre-sale reference price, if the item is on sale or has a compare-at. */
  wasPriceCents: number | null;
  onSale: boolean;
  /** Whole-number percent off, for a badge ("20% off"). */
  percentOff: number | null;
}

/**
 * Resolve the price a customer actually pays right now for one product at one
 * store. Sale price only applies inside its active window.
 */
export function getEffectivePrice(
  price: ResolvedStorePrice,
  unitType: UnitType,
  now: Date = new Date(),
): EffectivePrice {
  assertCents(price.priceCents, 'priceCents');

  const base =
    unitType === UnitType.WEIGHT
      ? (price.pricePerPoundCents ?? price.priceCents)
      : price.priceCents;

  const saleActive =
    price.salePriceCents != null &&
    price.salePriceCents < base &&
    (price.saleStartsAt == null || price.saleStartsAt <= now) &&
    (price.saleEndsAt == null || price.saleEndsAt >= now);

  const unitPriceCents = saleActive ? price.salePriceCents! : base;
  const wasPriceCents = saleActive
    ? base
    : price.compareAtPriceCents && price.compareAtPriceCents > base
      ? price.compareAtPriceCents
      : null;

  const reference = wasPriceCents ?? base;
  const percentOff =
    reference > unitPriceCents ? Math.round(((reference - unitPriceCents) / reference) * 100) : null;

  return {
    unitType,
    unitPriceCents,
    wasPriceCents,
    onSale: saleActive,
    percentOff: saleActive ? percentOff : null,
  };
}

/** Apply a variant's price delta (e.g. "10 lb" bag = +$8.00) to a base price. */
export function applyVariantDelta(unitPriceCents: number, deltaCents: number): number {
  return Math.max(0, assertCents(unitPriceCents) + assertCents(deltaCents));
}
