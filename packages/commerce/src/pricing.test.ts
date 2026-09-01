import { describe, expect, it } from 'vitest';
import { UnitType } from '@oasisa2/types';
import { applyVariantDelta, getEffectivePrice } from './pricing';

describe('pricing', () => {
  it('uses base price when no sale', () => {
    const p = getEffectivePrice({ priceCents: 499 }, UnitType.EACH);
    expect(p.unitPriceCents).toBe(499);
    expect(p.onSale).toBe(false);
    expect(p.percentOff).toBeNull();
  });

  it('applies an active sale and computes percent off', () => {
    const p = getEffectivePrice({ priceCents: 500, salePriceCents: 400 }, UnitType.EACH);
    expect(p.unitPriceCents).toBe(400);
    expect(p.onSale).toBe(true);
    expect(p.wasPriceCents).toBe(500);
    expect(p.percentOff).toBe(20);
  });

  it('ignores a sale outside its window', () => {
    const future = new Date(Date.now() + 86_400_000);
    const p = getEffectivePrice(
      { priceCents: 500, salePriceCents: 400, saleStartsAt: future },
      UnitType.EACH,
    );
    expect(p.unitPriceCents).toBe(500);
    expect(p.onSale).toBe(false);
  });

  it('uses price-per-pound for weight items', () => {
    const p = getEffectivePrice(
      { priceCents: 0, pricePerPoundCents: 599 },
      UnitType.WEIGHT,
    );
    expect(p.unitPriceCents).toBe(599);
  });

  it('applies variant delta without going negative', () => {
    expect(applyVariantDelta(500, 800)).toBe(1300);
    expect(applyVariantDelta(500, -900)).toBe(0);
  });
});
