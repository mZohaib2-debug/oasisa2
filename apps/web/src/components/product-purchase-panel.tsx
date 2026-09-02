'use client';

import { useMemo, useState, useTransition } from 'react';
import { Check, Loader2, Minus, Plus } from 'lucide-react';
import clsx from 'clsx';
import { WEIGHT_QUICK_PICKS_LB } from '@oasisa2/config';
import { formatCents } from '@/lib/format';
import { addToCartAction } from '@/app/actions';

interface Variant {
  id: string;
  name: string;
  packageSize: string | null;
  priceDeltaCents: number;
  isDefault: boolean;
}
interface ButcherOption {
  value: string;
  label: string;
  isDefault: boolean;
}

const GROUP_LABEL: Record<string, string> = {
  cut: 'Cut',
  pieceSize: 'Piece size',
  bone: 'Bone',
  thickness: 'Thickness',
  skin: 'Skin',
  fat: 'Fat',
};

export function ProductPurchasePanel({
  productId,
  unitType,
  unitPriceCents,
  averageWeightLb,
  available,
  variants,
  butcherGroups,
}: {
  productId: string;
  unitType: 'EACH' | 'WEIGHT';
  unitPriceCents: number;
  averageWeightLb: number | null;
  available: boolean;
  variants: Variant[];
  butcherGroups: Record<string, ButcherOption[]>;
}) {
  const [variantId, setVariantId] = useState(
    variants.find((v) => v.isDefault)?.id ?? variants[0]?.id ?? undefined,
  );
  const [qty, setQty] = useState(1);
  const [weightLb, setWeightLb] = useState(averageWeightLb ?? 1);
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const [group, opts] of Object.entries(butcherGroups)) {
      const def = opts.find((o) => o.isDefault) ?? opts[0];
      if (def) init[group] = def.value;
    }
    return init;
  });
  const [notes, setNotes] = useState('');
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedVariant = variants.find((v) => v.id === variantId);
  const effectiveUnitPrice = unitPriceCents + (selectedVariant?.priceDeltaCents ?? 0);

  const estimatedTotal = useMemo(() => {
    if (unitType === 'WEIGHT') return Math.round(effectiveUnitPrice * weightLb);
    return effectiveUnitPrice * qty;
  }, [unitType, effectiveUnitPrice, weightLb, qty]);

  const hasButcher = Object.keys(butcherGroups).length > 0;

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await addToCartAction({
        productId,
        variantId,
        quantity: unitType === 'EACH' ? qty : undefined,
        requestedWeightLb: unitType === 'WEIGHT' ? weightLb : undefined,
        butcherSelections: hasButcher ? selections : undefined,
        butcherNotes: hasButcher && notes ? notes : undefined,
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => setDone(false), 2200);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="card p-5">
      {variants.length > 0 && (
        <div className="mb-4">
          <p className="mb-1.5 text-sm font-semibold text-charcoal-900">Size</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                className={clsx(
                  'rounded-lg border px-3 py-2 text-sm font-semibold',
                  variantId === v.id
                    ? 'border-forest-600 bg-forest-50 text-forest-800'
                    : 'border-charcoal-700/15 hover:bg-forest-50',
                )}
              >
                {v.name}
                {v.priceDeltaCents !== 0 && (
                  <span className="ml-1 text-xs text-charcoal-700/60">
                    {v.priceDeltaCents > 0 ? '+' : ''}
                    {formatCents(v.priceDeltaCents)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {unitType === 'WEIGHT' ? (
        <div className="mb-4">
          <p className="mb-1.5 text-sm font-semibold text-charcoal-900">
            Approximate weight
            <span className="ml-1 font-normal text-charcoal-700/60">({formatCents(effectiveUnitPrice)}/lb)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {WEIGHT_QUICK_PICKS_LB.map((lb) => (
              <button
                key={lb}
                type="button"
                onClick={() => setWeightLb(lb)}
                className={clsx(
                  'rounded-lg border px-3 py-2 text-sm font-semibold',
                  weightLb === lb
                    ? 'border-forest-600 bg-forest-50 text-forest-800'
                    : 'border-charcoal-700/15 hover:bg-forest-50',
                )}
              >
                {lb} lb
              </button>
            ))}
            <label className="flex items-center gap-1 rounded-lg border border-charcoal-700/15 px-2 text-sm">
              <input
                type="number"
                min={0.25}
                step={0.25}
                value={weightLb}
                onChange={(e) => setWeightLb(Math.max(0.25, Number(e.target.value) || 0.25))}
                className="w-16 bg-transparent py-2 outline-none"
                aria-label="Custom approximate weight in pounds"
              />
              lb
            </label>
          </div>
          <p className="mt-1.5 text-xs text-charcoal-700/60">
            Final price may vary based on the actual prepared weight.
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <p className="mb-1.5 text-sm font-semibold text-charcoal-900">Quantity</p>
          <div className="inline-flex items-center rounded-lg border border-charcoal-700/15">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="p-2.5"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-semibold">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              className="p-2.5"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {hasButcher && (
        <div className="mb-4 rounded-lg bg-forest-50 p-3">
          <p className="text-sm font-bold text-forest-800">Butcher preparation</p>
          <p className="mb-2 text-xs text-forest-800/70">Cut fresh to order at no extra charge.</p>
          {Object.entries(butcherGroups).map(([group, opts]) => (
            <div key={group} className="mb-2">
              <p className="mb-1 text-xs font-semibold text-charcoal-900">
                {GROUP_LABEL[group] ?? group}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {opts.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setSelections((s) => ({ ...s, [group]: o.value }))}
                    className={clsx(
                      'rounded-full border px-2.5 py-1 text-xs font-semibold',
                      selections[group] === o.value
                        ? 'border-forest-600 bg-white text-forest-800'
                        : 'border-forest-200 bg-white/60 text-charcoal-700/80',
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <label className="mt-2 block text-xs font-semibold text-charcoal-900">
            Special instructions for the butcher
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="e.g. Please cut into small curry pieces."
              className="field mt-1 text-sm"
            />
          </label>
        </div>
      )}

      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-sm text-charcoal-700/70">
          {unitType === 'WEIGHT' ? 'Estimated total' : 'Total'}
        </span>
        <span className="text-xl font-black text-charcoal-900">{formatCents(estimatedTotal)}</span>
      </div>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!available || pending}
        className="btn-primary w-full"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : done ? (
          <Check className="h-4 w-4" />
        ) : null}
        {!available ? 'Out of stock' : done ? 'Added to cart' : 'Add to cart'}
      </button>
    </div>
  );
}
