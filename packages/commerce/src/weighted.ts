import { WEIGHT_RECONFIRM_THRESHOLD } from '@oasisa2/config';
import { multiplyCents } from './money';

/**
 * Weighted (by-the-pound) items. The customer chooses an approximate weight;
 * the butcher/picker later records the actual prepared weight and the line is
 * repriced. The order is NEVER locked to the estimate.
 */

export interface WeightedEstimate {
  pricePerPoundCents: number;
  requestedWeightLb: number;
  estimatedLineCents: number;
}

export function estimateWeightedLine(
  pricePerPoundCents: number,
  requestedWeightLb: number,
): WeightedEstimate {
  if (requestedWeightLb <= 0) {
    throw new Error(`requestedWeightLb must be > 0, got ${requestedWeightLb}`);
  }
  return {
    pricePerPoundCents,
    requestedWeightLb,
    estimatedLineCents: multiplyCents(pricePerPoundCents, requestedWeightLb),
  };
}

export interface WeightedFinal {
  pricePerPoundCents: number;
  actualWeightLb: number;
  finalLineCents: number;
  deltaFromEstimateCents: number;
  /** True when the drift exceeds the re-confirm threshold and staff should check with the customer. */
  requiresReconfirm: boolean;
}

export function finalizeWeightedLine(
  pricePerPoundCents: number,
  actualWeightLb: number,
  estimatedLineCents: number,
): WeightedFinal {
  if (actualWeightLb <= 0) {
    throw new Error(`actualWeightLb must be > 0, got ${actualWeightLb}`);
  }
  const finalLineCents = multiplyCents(pricePerPoundCents, actualWeightLb);
  const deltaFromEstimateCents = finalLineCents - estimatedLineCents;
  const driftFraction =
    estimatedLineCents > 0 ? Math.abs(deltaFromEstimateCents) / estimatedLineCents : 0;
  return {
    pricePerPoundCents,
    actualWeightLb,
    finalLineCents,
    deltaFromEstimateCents,
    requiresReconfirm: driftFraction > WEIGHT_RECONFIRM_THRESHOLD,
  };
}
