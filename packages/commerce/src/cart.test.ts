import { describe, expect, it } from 'vitest';
import { FulfillmentType, UnitType } from '@oasisa2/types';
import { computeCartTotals, type CartLineInput } from './cart';
import { quoteDelivery } from './delivery';
import type { PromotionRule } from './promotions';

const line = (over: Partial<CartLineInput>): CartLineInput => ({
  lineId: 'l1',
  productId: 'p1',
  categoryId: 'c1',
  departmentId: 'd1',
  name: 'Item',
  unitType: UnitType.EACH,
  taxable: false,
  unitPriceCents: 100,
  quantity: 1,
  ...over,
});

describe('computeCartTotals', () => {
  it('sums a simple pickup cart with no tax on groceries', () => {
    const t = computeCartTotals({
      lines: [
        line({ lineId: 'a', unitPriceCents: 499, quantity: 2 }),
        line({ lineId: 'b', unitPriceCents: 1099, quantity: 1 }),
      ],
      fulfillmentType: FulfillmentType.PICKUP,
      storeState: 'MD',
    });
    expect(t.subtotalGrossCents).toBe(2097);
    expect(t.subtotalCents).toBe(2097);
    expect(t.taxCents).toBe(0);
    expect(t.deliveryFeeCents).toBe(0);
    expect(t.estimatedTotalCents).toBe(2097);
    expect(t.itemCount).toBe(3);
  });

  it('taxes only taxable lines on the net amount', () => {
    const t = computeCartTotals({
      lines: [
        line({ lineId: 'food', unitPriceCents: 1000, taxable: false }),
        line({ lineId: 'soap', unitPriceCents: 500, taxable: true }),
      ],
      fulfillmentType: FulfillmentType.PICKUP,
      storeState: 'MD',
    });
    // 6% of 500 = 30
    expect(t.taxCents).toBe(30);
  });

  it('prices a weighted item as an estimate and flags it', () => {
    const t = computeCartTotals({
      lines: [
        line({
          lineId: 'goat',
          unitType: UnitType.WEIGHT,
          unitPriceCents: 999,
          requestedWeightLb: 3,
        }),
      ],
      fulfillmentType: FulfillmentType.PICKUP,
      storeState: 'MD',
    });
    expect(t.subtotalCents).toBe(2997);
    expect(t.hasEstimatedItems).toBe(true);
    expect(t.lines[0]!.isEstimated).toBe(true);
  });

  it('applies a category percent-off promotion to matching lines only', () => {
    const promo: PromotionRule = {
      id: 'promo1',
      name: '10% off Spices',
      type: 'PERCENT_OFF',
      scope: 'CATEGORY',
      value: 1000,
      priority: 10,
      productIds: [],
      categoryIds: ['spices'],
      departmentIds: [],
    };
    const t = computeCartTotals({
      lines: [
        line({ lineId: 'masala', categoryId: 'spices', unitPriceCents: 500, quantity: 2 }),
        line({ lineId: 'rice', categoryId: 'grains', unitPriceCents: 2000, quantity: 1 }),
      ],
      fulfillmentType: FulfillmentType.PICKUP,
      storeState: 'MD',
      promotions: [promo],
    });
    expect(t.lineDiscountCents).toBe(100); // 10% of $10.00
    expect(t.lines.find((l) => l.lineId === 'masala')!.promotionName).toBe('10% off Spices');
    expect(t.subtotalCents).toBe(2900);
  });

  it('computes delivery fee, minimum gate and free-delivery threshold', () => {
    const quote = quoteDelivery(
      '21061',
      {
        deliveryEnabled: true,
        deliveryFeeCents: 599,
        deliveryMinimumCents: 3500,
        freeDeliveryThresholdCents: 7500,
      },
      [
        {
          name: 'Core',
          postalCodes: ['21061'],
          isActive: true,
          deliveryFeeCents: null,
          deliveryMinimumCents: null,
          freeDeliveryThresholdCents: null,
          estimatedMinutes: 90,
        },
      ],
    );

    const under = computeCartTotals({
      lines: [line({ unitPriceCents: 3000, quantity: 1 })],
      fulfillmentType: FulfillmentType.DELIVERY,
      storeState: 'MD',
      deliveryQuote: quote,
    });
    expect(under.meetsDeliveryMinimum).toBe(false);
    expect(under.amountToMinimumCents).toBe(500);
    expect(under.deliveryFeeCents).toBe(599);

    const over = computeCartTotals({
      lines: [line({ unitPriceCents: 8000, quantity: 1 })],
      fulfillmentType: FulfillmentType.DELIVERY,
      storeState: 'MD',
      deliveryQuote: quote,
    });
    expect(over.meetsDeliveryMinimum).toBe(true);
    expect(over.deliveryFeeCents).toBe(0); // over free threshold
  });

  it('applies a coupon after promotions and never goes negative', () => {
    const t = computeCartTotals({
      lines: [line({ unitPriceCents: 1000, quantity: 1 })],
      fulfillmentType: FulfillmentType.PICKUP,
      storeState: 'MD',
      coupon: {
        code: 'SAVE20',
        type: 'AMOUNT_OFF',
        value: 5000,
        isActive: true,
        redemptionCount: 0,
      },
    });
    expect(t.subtotalCents).toBe(0);
    expect(t.couponDiscountCents).toBe(1000);
  });

  it('reports a coupon error without throwing', () => {
    const t = computeCartTotals({
      lines: [line({ unitPriceCents: 1000 })],
      fulfillmentType: FulfillmentType.PICKUP,
      storeState: 'MD',
      coupon: {
        code: 'BIGSPEND',
        type: 'PERCENT_OFF',
        value: 1000,
        minSubtotalCents: 5000,
        isActive: true,
        redemptionCount: 0,
      },
    });
    expect(t.couponError).toBe('below_minimum');
    expect(t.couponDiscountCents).toBe(0);
  });
});
