import { describe, expect, it } from 'vitest';
import { estimateWeightedLine, finalizeWeightedLine } from './weighted';

describe('weighted items', () => {
  it('estimates a line from requested pounds', () => {
    const est = estimateWeightedLine(599, 3);
    expect(est.estimatedLineCents).toBe(1797);
  });

  it('reprices from actual weight and reports the delta', () => {
    const est = estimateWeightedLine(599, 3); // $17.97
    const fin = finalizeWeightedLine(599, 3.2, est.estimatedLineCents);
    expect(fin.finalLineCents).toBe(1917); // 599 * 3.2 = 1916.8 -> 1917
    expect(fin.deltaFromEstimateCents).toBe(120);
    expect(fin.requiresReconfirm).toBe(false);
  });

  it('flags large drift for customer re-confirmation', () => {
    const est = estimateWeightedLine(1099, 2); // $21.98
    const fin = finalizeWeightedLine(1099, 3, est.estimatedLineCents); // $32.97, +50%
    expect(fin.requiresReconfirm).toBe(true);
  });

  it('does not lock the order to the estimate when actual is lower', () => {
    const est = estimateWeightedLine(799, 5);
    const fin = finalizeWeightedLine(799, 4.4, est.estimatedLineCents);
    expect(fin.finalLineCents).toBeLessThan(est.estimatedLineCents);
    expect(fin.deltaFromEstimateCents).toBeLessThan(0);
  });

  it('rejects non-positive weights', () => {
    expect(() => estimateWeightedLine(599, 0)).toThrow();
    expect(() => finalizeWeightedLine(599, -1, 100)).toThrow();
  });
});
