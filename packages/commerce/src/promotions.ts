import { applyBasisPoints, clampNonNegative } from './money';

/**
 * Promotion & coupon evaluation. Deliberately small and explicit: line-level
 * promotions first, then one order-level promotion, then at most one coupon.
 * All amounts in cents; PERCENT types use basis points (1000 = 10%).
 */

export type PromotionType = 'PERCENT_OFF' | 'AMOUNT_OFF' | 'BOGO' | 'FIXED_PRICE';
export type PromotionScope = 'ORDER' | 'PRODUCT' | 'CATEGORY' | 'DEPARTMENT';

export interface PromotionRule {
  id: string;
  name: string;
  type: PromotionType;
  scope: PromotionScope;
  value: number;
  bogoBuyQty?: number | null;
  bogoGetQty?: number | null;
  minSubtotalCents?: number | null;
  priority: number;
  productIds: string[];
  categoryIds: string[];
  departmentIds: string[];
}

export interface PromoLineInput {
  lineId: string;
  productId: string;
  categoryId: string;
  departmentId: string;
  unitPriceCents: number;
  quantity: number;
  lineCents: number;
}

export interface LineDiscount {
  lineId: string;
  promotionId: string;
  promotionName: string;
  discountCents: number;
}

function promoMatchesLine(promo: PromotionRule, line: PromoLineInput): boolean {
  if (promo.scope === 'PRODUCT') return promo.productIds.includes(line.productId);
  if (promo.scope === 'CATEGORY') return promo.categoryIds.includes(line.categoryId);
  if (promo.scope === 'DEPARTMENT') return promo.departmentIds.includes(line.departmentId);
  return false;
}

function lineDiscountFor(promo: PromotionRule, line: PromoLineInput): number {
  switch (promo.type) {
    case 'PERCENT_OFF':
      return applyBasisPoints(line.lineCents, promo.value);
    case 'AMOUNT_OFF':
      return Math.min(line.lineCents, promo.value * line.quantity);
    case 'FIXED_PRICE': {
      const target = promo.value * line.quantity;
      return clampNonNegative(line.lineCents - target);
    }
    case 'BOGO': {
      const buy = promo.bogoBuyQty ?? 1;
      const get = promo.bogoGetQty ?? 1;
      const cycle = buy + get;
      const freeUnits = Math.floor(line.quantity / cycle) * get;
      return freeUnits * line.unitPriceCents;
    }
    default:
      return 0;
  }
}

/** Best single line-level promotion per line (promotions do not stack per line). */
export function applyLinePromotions(
  lines: PromoLineInput[],
  promotions: PromotionRule[],
): LineDiscount[] {
  const linePromos = promotions
    .filter((p) => p.scope !== 'ORDER')
    .sort((a, b) => b.priority - a.priority);

  const result: LineDiscount[] = [];
  for (const line of lines) {
    let best: LineDiscount | null = null;
    for (const promo of linePromos) {
      if (!promoMatchesLine(promo, line)) continue;
      const discountCents = lineDiscountFor(promo, line);
      if (discountCents > 0 && (!best || discountCents > best.discountCents)) {
        best = {
          lineId: line.lineId,
          promotionId: promo.id,
          promotionName: promo.name,
          discountCents,
        };
      }
    }
    if (best) result.push(best);
  }
  return result;
}

export interface OrderDiscount {
  promotionId: string;
  promotionName: string;
  discountCents: number;
}

/** Highest-priority order-level promotion whose minimum is met. */
export function applyOrderPromotion(
  subtotalAfterLineCents: number,
  promotions: PromotionRule[],
): OrderDiscount | null {
  const candidates = promotions
    .filter((p) => p.scope === 'ORDER')
    .filter((p) => (p.minSubtotalCents ?? 0) <= subtotalAfterLineCents)
    .sort((a, b) => b.priority - a.priority);

  const promo = candidates[0];
  if (!promo) return null;

  let discountCents = 0;
  if (promo.type === 'PERCENT_OFF') discountCents = applyBasisPoints(subtotalAfterLineCents, promo.value);
  else if (promo.type === 'AMOUNT_OFF') discountCents = Math.min(subtotalAfterLineCents, promo.value);

  if (discountCents <= 0) return null;
  return { promotionId: promo.id, promotionName: promo.name, discountCents };
}

export type CouponType = 'PERCENT_OFF' | 'AMOUNT_OFF' | 'FREE_DELIVERY';

export interface CouponRule {
  code: string;
  type: CouponType;
  value: number;
  minSubtotalCents?: number | null;
  isActive: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  maxRedemptions?: number | null;
  redemptionCount: number;
}

export interface CouponEvaluation {
  valid: boolean;
  reason?: 'inactive' | 'not_started' | 'expired' | 'below_minimum' | 'exhausted';
  discountCents: number;
  freeDelivery: boolean;
}

export function evaluateCoupon(
  coupon: CouponRule,
  subtotalAfterDiscountsCents: number,
  deliveryFeeCents: number,
  now: Date = new Date(),
): CouponEvaluation {
  const fail = (reason: CouponEvaluation['reason']): CouponEvaluation => ({
    valid: false,
    reason,
    discountCents: 0,
    freeDelivery: false,
  });

  if (!coupon.isActive) return fail('inactive');
  if (coupon.startsAt && coupon.startsAt > now) return fail('not_started');
  if (coupon.endsAt && coupon.endsAt < now) return fail('expired');
  if (coupon.maxRedemptions != null && coupon.redemptionCount >= coupon.maxRedemptions) {
    return fail('exhausted');
  }
  if (coupon.minSubtotalCents != null && subtotalAfterDiscountsCents < coupon.minSubtotalCents) {
    return fail('below_minimum');
  }

  if (coupon.type === 'FREE_DELIVERY') {
    return { valid: true, discountCents: 0, freeDelivery: true };
  }
  const discountCents =
    coupon.type === 'PERCENT_OFF'
      ? applyBasisPoints(subtotalAfterDiscountsCents, coupon.value)
      : Math.min(subtotalAfterDiscountsCents, coupon.value);

  return { valid: true, discountCents, freeDelivery: false };
}
