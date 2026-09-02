'use client';

import { useFormStatus } from 'react-dom';
import { useState, useTransition } from 'react';
import clsx from 'clsx';
import type { Result } from '@/app/actions';

export function SubmitButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={clsx('btn-primary', className)}>
      {pending ? 'Saving…' : children}
    </button>
  );
}

/** Fire a server action from a button, show inline error/success. */
export function ActionButton({
  action,
  children,
  className = 'btn-secondary',
  confirm,
  onDone,
}: {
  action: () => Promise<Result>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
  onDone?: () => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        disabled={pending}
        className={className}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setError(null);
          start(async () => {
            const res = await action();
            if (!res.ok) setError(res.error);
            else onDone?.();
          });
        }}
      >
        {pending ? '…' : children}
      </button>
      {error && <span className="mt-1 text-xs text-red-600">{error}</span>}
    </span>
  );
}

export function FormResult({ state }: { state: { ok: boolean; error?: string } | null }) {
  if (!state) return null;
  return state.ok ? (
    <p className="rounded bg-forest-50 px-3 py-2 text-sm text-forest-800">Saved.</p>
  ) : (
    <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
  );
}

export function useAction() {
  const [pending, start] = useTransition();
  const [state, setState] = useState<{ ok: boolean; error?: string } | null>(null);
  function run(fn: () => Promise<Result>) {
    setState(null);
    start(async () => setState(await fn()));
  }
  return { pending, state, run, setState };
}
