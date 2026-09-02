'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { loginAction, registerAction } from '@/app/actions';

export function AuthForms() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handle(action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>, fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await action(fd);
      if (res.ok) router.push('/account');
      else setError(res.error ?? 'Something went wrong.');
    });
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-4 grid grid-cols-2 rounded-lg border border-charcoal-700/15 p-1 text-sm font-semibold">
        {(['login', 'register'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={clsx('rounded py-2', tab === t ? 'bg-forest-700 text-white' : 'text-charcoal-700')}
          >
            {t === 'login' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      {tab === 'login' ? (
        <form action={(fd) => handle(loginAction, fd)} className="card space-y-3 p-5">
          <label className="block text-sm font-semibold">
            Email
            <input name="email" type="email" required className="field mt-1" />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input name="password" type="password" required className="field mt-1" />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-xs text-charcoal-700/60">
            Demo: <span className="font-mono">customer@oasisa2.test</span> / <span className="font-mono">password123</span>
          </p>
        </form>
      ) : (
        <form action={(fd) => handle(registerAction, fd)} className="card space-y-3 p-5">
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-semibold">
              First name
              <input name="firstName" required className="field mt-1" />
            </label>
            <label className="block text-sm font-semibold">
              Last name
              <input name="lastName" required className="field mt-1" />
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Email
            <input name="email" type="email" required className="field mt-1" />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input name="password" type="password" required minLength={8} className="field mt-1" />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? 'Creating…' : 'Create account'}
          </button>
        </form>
      )}
    </div>
  );
}
