import { describe, expect, it } from 'vitest';
import { OrderStatus } from '@oasisa2/types';
import { assertTransition, canTransition, formatOrderNumber, isTerminal } from './orders';

describe('order lifecycle', () => {
  it('formats order numbers from a sequence', () => {
    expect(formatOrderNumber(0)).toBe('OA2-100000');
    expect(formatOrderNumber(234)).toBe('OA2-100234');
  });

  it('allows valid forward transitions', () => {
    expect(canTransition(OrderStatus.RECEIVED, OrderStatus.CONFIRMED)).toBe(true);
    expect(canTransition(OrderStatus.PACKED, OrderStatus.OUT_FOR_DELIVERY)).toBe(true);
  });

  it('rejects illegal transitions', () => {
    expect(canTransition(OrderStatus.RECEIVED, OrderStatus.DELIVERED)).toBe(false);
    expect(() => assertTransition(OrderStatus.COMPLETED, OrderStatus.PICKING)).toThrow();
  });

  it('knows terminal states', () => {
    expect(isTerminal(OrderStatus.COMPLETED)).toBe(true);
    expect(isTerminal(OrderStatus.CANCELLED)).toBe(true);
    expect(isTerminal(OrderStatus.PICKING)).toBe(false);
  });
});
