'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { regenerateSlotsAction } from '@/app/actions';

export function RegenerateSlotsButton({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        className="btn-secondary"
        onClick={() =>
          start(async () => {
            const res = await regenerateSlotsAction(storeId);
            setMsg(res.ok ? 'Slots regenerated.' : res.error);
            router.refresh();
          })
        }
      >
        {pending ? 'Working…' : 'Regenerate time slots'}
      </button>
      {msg && <span className="text-sm text-ink-500">{msg}</span>}
    </span>
  );
}
