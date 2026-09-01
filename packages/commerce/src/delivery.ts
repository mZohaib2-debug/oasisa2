/**
 * Delivery eligibility & economics. Per-branch rules, optionally overridden by
 * a matching DeliveryZone. Architecture leaves room for radius/distance pricing
 * later, but ZIP matching is the shipped mechanism.
 */

export interface BranchDeliveryConfig {
  deliveryEnabled: boolean;
  deliveryFeeCents: number;
  deliveryMinimumCents: number;
  freeDeliveryThresholdCents: number | null;
}

export interface DeliveryZoneConfig {
  name: string;
  postalCodes: string[];
  isActive: boolean;
  deliveryFeeCents: number | null;
  deliveryMinimumCents: number | null;
  freeDeliveryThresholdCents: number | null;
  estimatedMinutes: number | null;
}

export interface DeliveryQuote {
  eligible: boolean;
  reason?: 'delivery_disabled' | 'zip_not_served' | 'zip_invalid';
  zoneName: string | null;
  deliveryFeeCents: number;
  deliveryMinimumCents: number;
  freeDeliveryThresholdCents: number | null;
  estimatedMinutes: number | null;
}

export function normalizePostalCode(raw: string): string | null {
  const digits = raw.trim().slice(0, 5);
  return /^\d{5}$/.test(digits) ? digits : null;
}

export function quoteDelivery(
  postalCode: string,
  branch: BranchDeliveryConfig,
  zones: DeliveryZoneConfig[],
): DeliveryQuote {
  const zip = normalizePostalCode(postalCode);
  const base: Omit<DeliveryQuote, 'eligible' | 'reason'> = {
    zoneName: null,
    deliveryFeeCents: branch.deliveryFeeCents,
    deliveryMinimumCents: branch.deliveryMinimumCents,
    freeDeliveryThresholdCents: branch.freeDeliveryThresholdCents,
    estimatedMinutes: null,
  };

  if (!branch.deliveryEnabled) return { ...base, eligible: false, reason: 'delivery_disabled' };
  if (!zip) return { ...base, eligible: false, reason: 'zip_invalid' };

  const zone = zones.find((z) => z.isActive && z.postalCodes.includes(zip));
  if (!zone) return { ...base, eligible: false, reason: 'zip_not_served' };

  return {
    eligible: true,
    zoneName: zone.name,
    deliveryFeeCents: zone.deliveryFeeCents ?? branch.deliveryFeeCents,
    deliveryMinimumCents: zone.deliveryMinimumCents ?? branch.deliveryMinimumCents,
    freeDeliveryThresholdCents:
      zone.freeDeliveryThresholdCents ?? branch.freeDeliveryThresholdCents,
    estimatedMinutes: zone.estimatedMinutes,
  };
}

/** Resolve the fee actually charged given the order subtotal (free over threshold). */
export function resolveDeliveryFee(quote: DeliveryQuote, subtotalCents: number): number {
  if (!quote.eligible) return 0;
  if (quote.freeDeliveryThresholdCents != null && subtotalCents >= quote.freeDeliveryThresholdCents) {
    return 0;
  }
  return quote.deliveryFeeCents;
}

export function meetsDeliveryMinimum(quote: DeliveryQuote, subtotalCents: number): boolean {
  return subtotalCents >= quote.deliveryMinimumCents;
}
