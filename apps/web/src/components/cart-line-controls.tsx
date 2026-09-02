'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { removeCartItemAction, updateCartItemAction } from '@/app/actions';

export function CartQuantityControls({
  cartItemId,
  quantity,
  unitType,
}: {
  cartItemId: string;
  quantity: number;
  unitType: 'EACH' | 'WEIGHT';
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function update(next: number) {
    startTransition(async () => {
      await updateCartItemAction(cartItemId, next);
      router.refresh();
    });
  }
  function remove() {
    startTransition(async () => {
      await removeCartItemAction(cartItemId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {unitType === 'EACH' ? (
        <div className="inline-flex items-center rounded-lg border border-charcoal-700/15">
          <button type="button" onClick={() => update(quantity - 1)} disabled={pending} className="p-2" aria-label="Decrease">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-8 text-center text-sm font-semibold">
            {pending ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : quantity}
          </span>
          <button type="button" onClick={() => update(quantity + 1)} disabled={pending} className="p-2" aria-label="Increase">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <span className="text-sm text-charcoal-700/70">Qty set on product page</span>
      )}
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="p-2 text-charcoal-700/50 hover:text-red-600"
        aria-label="Remove item"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
