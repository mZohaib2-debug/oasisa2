import { DEFAULT_TAX_RATE, TAX_RATES_BY_STATE } from '@oasisa2/config';
import { FulfillmentType, UnitType } from '@oasisa2/types';
import { clampNonNegative, multiplyCents, roundCents, sumCents } from './money';
import {
  applyLinePromotions,
  applyOrderPromotion,
  evaluateCoupon,
  type CouponRule,
  type PromoLineInput,
  type PromotionRule,
} from './promotions';
import { resolveDeliveryFee, type DeliveryQuote } from './delivery';

/**
 * Authoritative cart / order total computation. The client NEVER submits money.
 * The API passes DB-resolved prices in here and trusts only the output.
 */

export interface CartLineInput {
  lineId: string;
  productId: string;
  categoryId: string;
  departmentId: string;
  name: string;
  unitType: UnitType;
  taxable: boolean;
  /** EACH: price per package. WEIGHT: price per pound. Already store-resolved & variant-adjusted. */
  unitPriceCents: number;
  /** EACH: package count. WEIGHT: ignored (weight drives it). */
  quantity: number;
  /** WEIGHT only: requested pounds. */
  requestedWeightLb?: number | null;
}

export interface CartLineTotal {
  lineId: string;
  name: string;
  unitType: UnitType;
  quantity: number;
  requestedWeightLb: number | null;
  unitPriceCents: number;
  grossLineCents: number;
  discountCents: number;
  netLineCents: number;
  promotionName: string | null;
  isEstimated: boolean;
}

export interface CartTotalsInput {
  lines: CartLineInput[];
  fulfillmentType: FulfillmentType;
  storeState: string;
  promotions?: PromotionRule[];
  coupon?: CouponRule | null;
  deliveryQuote?: DeliveryQuote | null;
  tipCents?: number;
}

export interface CartTotals {
  lines: CartLineTotal[];
  currency: 'usd';
  itemCount: number;
  hasEstimatedItems: boolean;
  subtotalGrossCents: number;
  lineDiscountCents: number;
  orderDiscountCents: number;
  couponDiscountCents: number;
  discountCents: number;
  subtotalCents: number; // gross - all discounts, floored at 0
  deliveryFeeCents: number;
  taxCents: number;
  tipCents: number;
  estimatedTotalCents: number;
  // Fulfillment gating for the checkout button.
  deliveryEligible: boolean;
  meetsDeliveryMinimum: boolean;
  amountToMinimumCents: number;
  couponError: string | null;
}

function grossLine(line: CartLineInput): { gross: number; estimated: boolean } {
  if (line.unitType === UnitType.WEIGHT) {
    const lb = line.requestedWeightLb ?? 0;
    return { gross: multiplyCents(line.unitPriceCents, lb), estimated: true };
  }
  return { gross: multiplyCents(line.unitPriceCents, line.quantity), estimated: false };
}

export function computeCartTotals(input: CartTotalsInput): CartTotals {
  const promotions = input.promotions ?? [];
  const tipCents = Math.max(0, roundCents(input.tipCents ?? 0));

  // 1. Gross lines
  const gross = input.lines.map((line) => {
    const g = grossLine(line);
    return { line, gross: g.gross, estimated: g.estimated };
  });

  // 2. Line-level promotions
  const promoInputs: PromoLineInput[] = gross.map(({ line, gross: g }) => ({
    lineId: line.lineId,
    productId: line.productId,
    categoryId: line.categoryId,
    departmentId: line.departmentId,
    unitPriceCents: line.unitPriceCents,
    quantity: line.unitType === UnitType.WEIGHT ? 1 : line.quantity,
    lineCents: g,
  }));
  const lineDiscounts = applyLinePromotions(promoInputs, promotions);
  const discountByLine = new Map(lineDiscounts.map((d) => [d.lineId, d]));

  const lines: CartLineTotal[] = gross.map(({ line, gross: g, estimated }) => {
    const d = discountByLine.get(line.lineId);
    const discountCents = Math.min(g, d?.discountCents ?? 0);
    return {
      lineId: line.lineId,
      name: line.name,
      unitType: line.unitType,
      quantity: line.quantity,
      requestedWeightLb: line.requestedWeightLb ?? null,
      unitPriceCents: line.unitPriceCents,
      grossLineCents: g,
      discountCents,
      netLineCents: g - discountCents,
      promotionName: d?.promotionName ?? null,
      isEstimated: estimated,
    };
  });

  const subtotalGrossCents = sumCents(lines.map((l) => l.grossLineCents));
  const lineDiscountCents = sumCents(lines.map((l) => l.discountCents));
  const subtotalAfterLineCents = subtotalGrossCents - lineDiscountCents;

  // 3. Order-level promotion
  const orderPromo = applyOrderPromotion(subtotalAfterLineCents, promotions);
  const orderDiscountCents = Math.min(subtotalAfterLineCents, orderPromo?.discountCents ?? 0);
  const subtotalAfterOrderCents = subtotalAfterLineCents - orderDiscountCents;

  // 4. Delivery fee (pre-coupon; a FREE_DELIVERY coupon can zero it)
  const isDelivery = input.fulfillmentType === FulfillmentType.DELIVERY;
  const quote = input.deliveryQuote ?? null;
  const deliveryEligible = !isDelivery || (quote?.eligible ?? false);
  let deliveryFeeCents =
    isDelivery && quote?.eligible ? resolveDeliveryFee(quote, subtotalAfterOrderCents) : 0;

  // 5. Coupon
  let couponDiscountCents = 0;
  let couponError: string | null = null;
  if (input.coupon) {
    const evaluation = evaluateCoupon(input.coupon, subtotalAfterOrderCents, deliveryFeeCents);
    if (!evaluation.valid) {
      couponError = evaluation.reason ?? 'invalid';
    } else {
      couponDiscountCents = Math.min(subtotalAfterOrderCents, evaluation.discountCents);
      if (evaluation.freeDelivery) deliveryFeeCents = 0;
    }
  }

  const subtotalCents = clampNonNegative(subtotalAfterOrderCents - couponDiscountCents);
  const discountCents = lineDiscountCents + orderDiscountCents + couponDiscountCents;

  // 6. Tax — only on taxable lines, proportionally net of discount
  const taxRate = TAX_RATES_BY_STATE[input.storeState] ?? DEFAULT_TAX_RATE;
  const taxableNet = lines
    .filter((_, i) => input.lines[i]!.taxable)
    .reduce((acc, l) => acc + l.netLineCents, 0);
  const taxCents = roundCents(taxableNet * taxRate);

  // 7. Delivery minimum gate (checked against post-discount subtotal)
  const deliveryMinimumCents = isDelivery && quote ? quote.deliveryMinimumCents : 0;
  const meetsDeliveryMinimum = !isDelivery || subtotalCents >= deliveryMinimumCents;
  const amountToMinimumCents = meetsDeliveryMinimum
    ? 0
    : clampNonNegative(deliveryMinimumCents - subtotalCents);

  const estimatedTotalCents = subtotalCents + deliveryFeeCents + taxCents + tipCents;

  return {
    lines,
    currency: 'usd',
    itemCount: input.lines.reduce(
      (acc, l) => acc + (l.unitType === UnitType.WEIGHT ? 1 : l.quantity),
      0,
    ),
    hasEstimatedItems: lines.some((l) => l.isEstimated),
    subtotalGrossCents,
    lineDiscountCents,
    orderDiscountCents,
    couponDiscountCents,
    discountCents,
    subtotalCents,
    deliveryFeeCents,
    taxCents,
    tipCents,
    estimatedTotalCents,
    deliveryEligible,
    meetsDeliveryMinimum,
    amountToMinimumCents,
    couponError,
  };
}
