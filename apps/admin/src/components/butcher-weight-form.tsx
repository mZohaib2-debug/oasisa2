'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { recordWeightAction } from '@/app/actions';
import { formatCents } from '@/lib/format';

export function ButcherWeightForm({
  orderItemId,
  estimateLb,
  pricePerPoundCents,
}: {
  orderItemId: string;
  estimateLb: number;
  pricePerPoundCents: number;
}) {
  const router = useRouter();
  const [weight, setWeight] = useState(String(estimateLb));
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ finalLineCents: number; requiresReconfirm: boolean } | null>(
    null,
  );

  const w = Number(weight);
  const preview = Number.isFinite(w) && w > 0 ? Math.round(pricePerPoundCents * w) : 0;

  function submit() {
    setError(null);
    start(async () => {
      const res = await recordWeightAction(orderItemId, w);
      if (!res.ok) setError(res.error);
      else {
        setResult(res.data as { finalLineCents: number; requiresReconfirm: boolean });
        router.refresh();
      }
    });
  }

  if (result) {
    return (
      <p className="text-sm text-forest-800">
        Recorded. Final line {formatCents(result.finalLineCents)}.
        {result.requiresReconfirm && (
          <span className="text-amber-700"> ⚠ Large change — check with the customer.</span>
        )}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-xs font-semibold text-ink-600">
        Actual weight (lb)
        <input
          type="number"
          min={0.05}
          step={0.05}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="field mt-1 w-28"
        />
      </label>
      <span className="pb-2 text-sm text-ink-500">
        = {formatCents(preview)} ({formatCents(pricePerPoundCents)}/lb)
      </span>
      <button type="button" disabled={pending || !(w > 0)} onClick={submit} className="btn-primary">
        {pending ? 'Saving…' : 'Record weight'}
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
