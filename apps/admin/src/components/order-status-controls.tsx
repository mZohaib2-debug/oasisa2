'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ORDER_STATUS_FLOW, type OrderStatus } from '@oasisa2/types';
import { transitionOrderAction } from '@/app/actions';
import { statusLabel } from '@/lib/format';

export function OrderStatusControls({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const nexts = ORDER_STATUS_FLOW[status] ?? [];

  function go(to: OrderStatus) {
    setError(null);
    start(async () => {
      const res = await transitionOrderAction(orderId, to);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  if (nexts.length === 0) {
    return <p className="text-sm text-ink-500">Order is {statusLabel(status)} — no further actions.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {nexts.map((to) => (
          <button
            key={to}
            type="button"
            disabled={pending}
            onClick={() => go(to)}
            className={to === 'CANCELLED' ? 'btn-danger' : 'btn-primary'}
          >
            {to === 'CANCELLED' ? 'Cancel order' : `Mark ${statusLabel(to)}`}
          </button>
        ))}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
