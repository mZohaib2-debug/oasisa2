'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleSlotAction } from '@/app/actions';

export function SlotToggle({ slotId, isActive }: { slotId: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await toggleSlotAction(slotId, !isActive);
          router.refresh();
        })
      }
      className={
        isActive
          ? 'rounded bg-forest-100 px-2 py-0.5 text-xs font-semibold text-forest-800'
          : 'rounded bg-ink-200 px-2 py-0.5 text-xs font-semibold text-ink-600'
      }
    >
      {pending ? '…' : isActive ? 'Open' : 'Closed'}
    </button>
  );
}
