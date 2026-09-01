import { describe, expect, it } from 'vitest';
import { InventoryState } from '@oasisa2/types';
import {
  availableQuantity,
  deriveInventoryState,
  finalizeReservation,
  isPurchasable,
  releaseReservation,
  tryReserve,
} from './inventory';

describe('inventory', () => {
  it('computes available quantity net of reservations', () => {
    expect(availableQuantity({ state: InventoryState.IN_STOCK, quantityOnHand: 10, quantityReserved: 3, lowStockThreshold: 5 })).toBe(7);
  });

  it('treats a manual hold as unavailable', () => {
    const row = { state: InventoryState.TEMPORARILY_UNAVAILABLE, quantityOnHand: 10, quantityReserved: 0, lowStockThreshold: 5 };
    expect(availableQuantity(row)).toBe(0);
    expect(isPurchasable(row)).toBe(false);
  });

  it('derives coarse state from quantities', () => {
    expect(deriveInventoryState(0, 0, 5)).toBe(InventoryState.OUT_OF_STOCK);
    expect(deriveInventoryState(4, 0, 5)).toBe(InventoryState.LOW_STOCK);
    expect(deriveInventoryState(20, 0, 5)).toBe(InventoryState.IN_STOCK);
    expect(deriveInventoryState(20, 0, 5, true)).toBe(InventoryState.TEMPORARILY_UNAVAILABLE);
  });

  it('reserves only when stock is sufficient (race guard is caller DB lock)', () => {
    const row = { state: InventoryState.IN_STOCK, quantityOnHand: 5, quantityReserved: 4, lowStockThreshold: 2 };
    expect(tryReserve(row, 1).ok).toBe(true);
    expect(tryReserve(row, 2).ok).toBe(false);
  });

  it('releases and finalizes reservations', () => {
    expect(releaseReservation({ state: InventoryState.IN_STOCK, quantityOnHand: 5, quantityReserved: 3, lowStockThreshold: 2 }, 2)).toBe(1);
    const fin = finalizeReservation({ state: InventoryState.IN_STOCK, quantityOnHand: 5, quantityReserved: 3, lowStockThreshold: 2 }, 3);
    expect(fin.quantityOnHandAfter).toBe(2);
    expect(fin.quantityReservedAfter).toBe(0);
  });
});
