import { ORDER_NUMBER_PREFIX, ORDER_NUMBER_START } from '@oasisa2/config';
import { ORDER_STATUS_FLOW, OrderStatus } from '@oasisa2/types';

/** Human-friendly order number from a monotonic sequence value. */
export function formatOrderNumber(sequence: number): string {
  return `${ORDER_NUMBER_PREFIX}${ORDER_NUMBER_START + sequence}`;
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_FLOW[from]?.includes(to) ?? false;
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal order status transition: ${from} -> ${to}`);
  }
}

const TERMINAL: OrderStatus[] = [OrderStatus.COMPLETED, OrderStatus.CANCELLED];
export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL.includes(status);
}

/** Statuses at which a final (post-weigh) total should be recomputed. */
export function shouldRecomputeFinalTotal(status: OrderStatus): boolean {
  return status === OrderStatus.PACKED;
}
