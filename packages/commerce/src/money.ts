/**
 * Money is ALWAYS an integer number of US cents. No floats, ever.
 * These helpers are the only place rounding is allowed.
 */

export class MoneyError extends Error {}

export function assertCents(value: number, label = 'amount'): number {
  if (!Number.isInteger(value)) {
    throw new MoneyError(`${label} must be integer cents, got ${value}`);
  }
  return value;
}

/** Round a fractional cent result to the nearest whole cent (half up). */
export function roundCents(value: number): number {
  return Math.round(value);
}

/** Multiply a cents amount by a real-valued quantity (e.g. pounds), round once. */
export function multiplyCents(cents: number, quantity: number): number {
  assertCents(cents);
  if (quantity < 0) throw new MoneyError(`quantity must be >= 0, got ${quantity}`);
  return roundCents(cents * quantity);
}

/** Apply a basis-point discount (1000 bps = 10%) to a cents amount. */
export function applyBasisPoints(cents: number, basisPoints: number): number {
  assertCents(cents);
  if (basisPoints < 0 || basisPoints > 10000) {
    throw new MoneyError(`basisPoints out of range: ${basisPoints}`);
  }
  return roundCents((cents * basisPoints) / 10000);
}

export function sumCents(values: number[]): number {
  return values.reduce((acc, v) => acc + assertCents(v), 0);
}

/** Never let a computed total go below zero. */
export function clampNonNegative(cents: number): number {
  return Math.max(0, cents);
}

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatCents(cents: number): string {
  return USD.format(cents / 100);
}

/** "$5.99/lb" style label. */
export function formatPerPound(cents: number): string {
  return `${formatCents(cents)}/lb`;
}

export function dollarsToCents(dollars: number): number {
  return roundCents(dollars * 100);
}
