import { describe, expect, it } from 'vitest';
import {
  applyBasisPoints,
  assertCents,
  clampNonNegative,
  formatCents,
  formatPerPound,
  multiplyCents,
  MoneyError,
  sumCents,
} from './money';

describe('money', () => {
  it('rejects non-integer cents', () => {
    expect(() => assertCents(9.99)).toThrow(MoneyError);
  });

  it('multiplies cents by a real quantity and rounds once', () => {
    // 599 c/lb * 2.5 lb = 1497.5 -> 1498
    expect(multiplyCents(599, 2.5)).toBe(1498);
    expect(multiplyCents(1099, 3)).toBe(3297);
  });

  it('applies basis-point discounts', () => {
    expect(applyBasisPoints(1000, 1000)).toBe(100); // 10% of $10.00
    expect(applyBasisPoints(999, 1500)).toBe(150); // 14.985 -> 150
  });

  it('sums and clamps', () => {
    expect(sumCents([100, 200, 50])).toBe(350);
    expect(clampNonNegative(-5)).toBe(0);
  });

  it('formats', () => {
    expect(formatCents(599)).toBe('$5.99');
    expect(formatPerPound(1099)).toBe('$10.99/lb');
  });
});
