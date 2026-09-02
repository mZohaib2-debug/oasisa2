'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { adjustInventoryAction } from '@/app/actions';

const REASONS = [
  ['RECOUNT', 'Recount'],
  ['RECEIVED_STOCK', 'Received stock'],
  ['DAMAGE', 'Damage'],
  ['SPOILAGE', 'Spoilage'],
  ['THEFT', 'Theft'],
  ['MANUAL', 'Manual'],
] as const;

export function InventoryAdjustForm({
  storeId,
  productId,
  current,
}: {
  storeId: string;
  productId: string;
  current: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      action={(fd) => {
        setError(null);
        start(async () => {
          const res = await adjustInventoryAction(fd);
          if (!res.ok) setError(res.error);
          else router.refresh();
        });
      }}
    >
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="productId" value={productId} />
      <label className="text-xs font-semibold text-ink-600">
        Set on-hand
        <input
          name="quantity"
          type="number"
          min={0}
          defaultValue={current}
          className="field mt-1 w-24"
          required
        />
      </label>
      <select name="reason" className="field w-auto text-sm" defaultValue="RECOUNT">
        {REASONS.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <input name="note" placeholder="Note (optional)" className="field w-40 text-sm" />
      <button type="submit" disabled={pending} className="btn-secondary">
        {pending ? '…' : 'Adjust'}
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
