'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { applyCouponAction } from '@/app/actions';

export function CouponForm({ current }: { current: string | null }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function apply(value: string | null) {
    setError(null);
    startTransition(async () => {
      const res = await applyCouponAction(value);
      if (!res.ok) setError(res.error);
      else setCode('');
      router.refresh();
    });
  }

  if (current) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-forest-50 px-3 py-2 text-sm">
        <span>
          Coupon <strong className="font-mono">{current}</strong> applied
        </span>
        <button type="button" onClick={() => apply(null)} disabled={pending} aria-label="Remove coupon">
          <X className="h-4 w-4 text-charcoal-700/60" />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (code.trim()) apply(code.trim());
      }}
    >
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Promo code"
          className="field"
          aria-label="Promo code"
        />
        <button type="submit" disabled={pending || !code.trim()} className="btn-secondary">
          Apply
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </form>
  );
}
