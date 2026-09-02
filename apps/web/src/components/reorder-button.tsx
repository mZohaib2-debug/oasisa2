'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { addListToCartAction, reorderAction } from '@/app/actions';

export function ReorderButton({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          const res = await reorderAction(orderNumber);
          if (res.ok) {
            setDone(true);
            router.push('/cart');
          }
        })
      }
      disabled={pending}
      className="btn-secondary px-2.5 py-1.5 text-xs"
    >
      <RotateCcw className="h-3.5 w-3.5" />
      {done ? 'Added' : pending ? 'Adding…' : 'Buy again'}
    </button>
  );
}

export function AddListButton({ listId }: { listId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          const res = await addListToCartAction(listId);
          if (res.ok) router.push('/cart');
        })
      }
      disabled={pending}
      className="btn-primary px-3 py-1.5 text-xs"
    >
      {pending ? 'Adding…' : 'Add all to cart'}
    </button>
  );
}
