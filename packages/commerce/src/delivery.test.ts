import { describe, expect, it } from 'vitest';
import {
  meetsDeliveryMinimum,
  normalizePostalCode,
  quoteDelivery,
  resolveDeliveryFee,
  type BranchDeliveryConfig,
  type DeliveryZoneConfig,
} from './delivery';

const branch: BranchDeliveryConfig = {
  deliveryEnabled: true,
  deliveryFeeCents: 599,
  deliveryMinimumCents: 3500,
  freeDeliveryThresholdCents: 7500,
};

const zones: DeliveryZoneConfig[] = [
  {
    name: 'Glen Burnie Core',
    postalCodes: ['21060', '21061'],
    isActive: true,
    deliveryFeeCents: 499,
    deliveryMinimumCents: null,
    freeDeliveryThresholdCents: null,
    estimatedMinutes: 90,
  },
];

describe('delivery eligibility', () => {
  it('normalizes ZIP+4 and rejects junk', () => {
    expect(normalizePostalCode('21061-1234')).toBe('21061');
    expect(normalizePostalCode('2106')).toBeNull();
    expect(normalizePostalCode('abcde')).toBeNull();
  });

  it('serves a ZIP inside an active zone with the zone fee override', () => {
    const q = quoteDelivery('21061', branch, zones);
    expect(q.eligible).toBe(true);
    expect(q.zoneName).toBe('Glen Burnie Core');
    expect(q.deliveryFeeCents).toBe(499);
    expect(q.deliveryMinimumCents).toBe(3500); // falls back to branch
  });

  it('rejects a ZIP not in any zone', () => {
    const q = quoteDelivery('99999', branch, zones);
    expect(q.eligible).toBe(false);
    expect(q.reason).toBe('zip_not_served');
  });

  it('rejects when delivery disabled for the branch', () => {
    const q = quoteDelivery('21061', { ...branch, deliveryEnabled: false }, zones);
    expect(q.eligible).toBe(false);
    expect(q.reason).toBe('delivery_disabled');
  });

  it('waives the fee over the free-delivery threshold', () => {
    const q = quoteDelivery('21061', branch, zones);
    expect(resolveDeliveryFee(q, 5000)).toBe(499);
    expect(resolveDeliveryFee(q, 8000)).toBe(0);
  });

  it('enforces the delivery minimum', () => {
    const q = quoteDelivery('21061', branch, zones);
    expect(meetsDeliveryMinimum(q, 3000)).toBe(false);
    expect(meetsDeliveryMinimum(q, 3500)).toBe(true);
  });
});
