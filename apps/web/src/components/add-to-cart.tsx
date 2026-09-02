'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2, Plus } from 'lucide-react';
import clsx from 'clsx';
import { addToCartAction } from '@/app/actions';
import type { ButcherSelections } from '@oasisa2/types';

interface Props {
  productId: string;
  variantId?: string;
  unitType: 'EACH' | 'WEIGHT';
  requestedWeightLb?: number;
  quantity?: number;
  butcherSelections?: ButcherSelections;
  butcherNotes?: string;
  disabled?: boolean;
  full?: boolean;
  label?: string;
  onAdded?: () => void;
}

export function AddToCart({
  productId,
  variantId,
  unitType,
  requestedWeightLb,
  quantity = 1,
  butcherSelections,
  butcherNotes,
  disabled,
  full,
  label,
  onAdded,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<'idle' | 'added' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  function add() {
    setState('idle');
    setMessage(null);
    startTransition(async () => {
      const res = await addToCartAction({
        productId,
        variantId,
        quantity: unitType === 'EACH' ? quantity : undefined,
        requestedWeightLb: unitType === 'WEIGHT' ? (requestedWeightLb ?? 1) : undefined,
        butcherSelections,
        butcherNotes,
      });
      if (res.ok) {
        setState('added');
        onAdded?.();
        setTimeout(() => setState('idle'), 1800);
      } else {
        setState('error');
        setMessage(res.error);
      }
    });
  }

  return (
    <div className={clsx(full && 'w-full')}>
      <button
        type="button"
        onClick={add}
        disabled={disabled || pending}
        className={clsx('btn-primary', full ? 'w-full' : 'px-3 py-2 text-xs')}
        aria-label={label ?? 'Add to cart'}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : state === 'added' ? (
          <Check className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {full ? (state === 'added' ? 'Added to cart' : (label ?? 'Add to cart')) : null}
      </button>
      {message && <p className="mt-1 text-xs text-red-600">{message}</p>}
    </div>
  );
}
