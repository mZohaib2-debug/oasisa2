'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ScissorsSquare, X, Repeat } from 'lucide-react';
import clsx from 'clsx';
import { setItemStatusAction } from '@/app/actions';
import { butcherSummary, statusLabel } from '@/lib/format';

interface Item {
  id: string;
  name: string;
  sku: string;
  unitType: 'EACH' | 'WEIGHT';
  quantity: number;
  requestedWeightLb: number | null;
  aisle: string | null;
  status: string;
  substitution: string;
  butcherSelections: unknown;
  butcherNotes: string | null;
  hasButcher: boolean;
}

const RESOLVED = ['PICKED', 'SUBSTITUTED', 'NOT_AVAILABLE', 'BUTCHER_DONE', 'PACKED'];

export function PickerItem({ item }: { item: Item }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [subNote, setSubNote] = useState('');
  const [showSub, setShowSub] = useState(false);

  const resolved = RESOLVED.includes(item.status);

  function act(status: 'PICKED' | 'NOT_AVAILABLE' | 'SENT_TO_BUTCHER' | 'SUBSTITUTED', note?: string) {
    setError(null);
    start(async () => {
      const res = await setItemStatusAction(item.id, status, note ? { substitutionNote: note } : undefined);
      if (!res.ok) setError(res.error);
      else {
        setShowSub(false);
        router.refresh();
      }
    });
  }

  return (
    <div
      className={clsx(
        'rounded-lg border p-3',
        resolved ? 'border-forest-200 bg-forest-50/50' : 'border-ink-200 bg-white',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink-900">{item.name}</p>
          <p className="text-xs text-ink-400">
            {item.sku}
            {item.aisle ? ` · aisle ${item.aisle}` : ''} ·{' '}
            {item.unitType === 'WEIGHT'
              ? `~${item.requestedWeightLb} lb`
              : `qty ${item.quantity}`}
          </p>
          {item.hasButcher && (
            <p className="mt-0.5 text-xs text-rose-700">
              Butcher: {butcherSummary(item.butcherSelections) || 'see notes'}
              {item.butcherNotes ? ` — “${item.butcherNotes}”` : ''}
            </p>
          )}
          <p className="text-xs text-ink-400">If out: {statusLabel(item.substitution)}</p>
        </div>
        <span
          className={clsx(
            'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold',
            resolved ? 'bg-forest-200 text-forest-900' : 'bg-ink-100 text-ink-600',
          )}
        >
          {statusLabel(item.status)}
        </span>
      </div>

      {!resolved && (
        <div className="mt-2 flex flex-wrap gap-2">
          {item.hasButcher && (
            <button
              type="button"
              disabled={pending}
              onClick={() => act('SENT_TO_BUTCHER')}
              className="btn bg-rose-600 text-white hover:bg-rose-700"
            >
              <ScissorsSquare className="h-4 w-4" /> Send to butcher
            </button>
          )}
          <button type="button" disabled={pending} onClick={() => act('PICKED')} className="btn-primary">
            <Check className="h-4 w-4" /> Picked
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setShowSub((s) => !s)}
            className="btn-secondary"
          >
            <Repeat className="h-4 w-4" /> Substitute
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => act('NOT_AVAILABLE')}
            className="btn bg-ink-200 text-ink-800 hover:bg-ink-300"
          >
            <X className="h-4 w-4" /> Not available
          </button>
        </div>
      )}

      {showSub && (
        <div className="mt-2 flex gap-2">
          <input
            value={subNote}
            onChange={(e) => setSubNote(e.target.value)}
            placeholder="What did you substitute with?"
            className="field"
          />
          <button
            type="button"
            disabled={pending || !subNote.trim()}
            onClick={() => act('SUBSTITUTED', subNote.trim())}
            className="btn-primary"
          >
            Save
          </button>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
