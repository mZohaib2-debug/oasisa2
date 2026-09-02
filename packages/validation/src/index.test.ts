import { describe, expect, it } from 'vitest';
import { addToCartSchema, checkoutSchema, postalCodeSchema, storeContextSchema } from './index';

describe('validation schemas', () => {
  it('accepts a valid store context and rejects a bad ZIP', () => {
    expect(storeContextSchema.safeParse({ storeSlug: 'glen-burnie', fulfillmentType: 'PICKUP' }).success).toBe(true);
    expect(postalCodeSchema.safeParse('2106').success).toBe(false);
    expect(postalCodeSchema.safeParse('21061').success).toBe(true);
  });

  it('never accepts a price field on add-to-cart', () => {
    const parsed = addToCartSchema.parse({
      productId: 'p1',
      quantity: 2,
      // @ts-expect-error extra field must be stripped
      unitPriceCents: 1,
    });
    expect('unitPriceCents' in parsed).toBe(false);
  });

  it('requires a slot for checkout', () => {
    const res = checkoutSchema.safeParse({
      contactName: 'A',
      contactPhone: '5550100',
      fulfillmentType: 'PICKUP',
    });
    expect(res.success).toBe(false);
  });
});
