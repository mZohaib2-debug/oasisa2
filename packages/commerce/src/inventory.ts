import { InventoryState } from '@oasisa2/types';

/** Inventory state derivation & reservation math. Availability is per branch. */

export interface InventoryRow {
  state: InventoryState;
  quantityOnHand: number;
  quantityReserved: number;
  lowStockThreshold: number;
}

/** Units a customer can actually add right now. */
export function availableQuantity(row: InventoryRow): number {
  if (row.state === InventoryState.TEMPORARILY_UNAVAILABLE) return 0;
  return Math.max(0, row.quantityOnHand - row.quantityReserved);
}

export function isPurchasable(row: InventoryRow, requestedQty = 1): boolean {
  return availableQuantity(row) >= requestedQty;
}

/** Recompute the coarse InventoryState from quantities (unless manually held). */
export function deriveInventoryState(
  quantityOnHand: number,
  quantityReserved: number,
  lowStockThreshold: number,
  manualHold = false,
): InventoryState {
  if (manualHold) return InventoryState.TEMPORARILY_UNAVAILABLE;
  const available = Math.max(0, quantityOnHand - quantityReserved);
  if (available <= 0) return InventoryState.OUT_OF_STOCK;
  if (available <= lowStockThreshold) return InventoryState.LOW_STOCK;
  return InventoryState.IN_STOCK;
}

export interface ReservationResult {
  ok: boolean;
  reason?: 'insufficient_stock';
  quantityReservedAfter: number;
}

/** Attempt to hold `qty` units. Caller performs this inside a DB transaction
 *  with a row lock (SELECT ... FOR UPDATE) to avoid races. */
export function tryReserve(row: InventoryRow, qty: number): ReservationResult {
  if (availableQuantity(row) < qty) {
    return { ok: false, reason: 'insufficient_stock', quantityReservedAfter: row.quantityReserved };
  }
  return { ok: true, quantityReservedAfter: row.quantityReserved + qty };
}

export function releaseReservation(row: InventoryRow, qty: number): number {
  return Math.max(0, row.quantityReserved - qty);
}

/** Finalize a fulfilled order line: reservation becomes an actual decrement. */
export function finalizeReservation(
  row: InventoryRow,
  qty: number,
): { quantityOnHandAfter: number; quantityReservedAfter: number } {
  return {
    quantityOnHandAfter: Math.max(0, row.quantityOnHand - qty),
    quantityReservedAfter: Math.max(0, row.quantityReserved - qty),
  };
}
