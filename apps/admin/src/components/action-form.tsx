'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import type { Result } from '@/app/actions';

/** A <form> that calls a server action returning Result, shows inline status,
 *  and refreshes the route on success. */
export function ActionForm({
  action,
  children,
  submitLabel = 'Save',
  className,
  resetOnSuccess = false,
  successLabel = 'Saved.',
}: {
  action: (fd: FormData) => Promise<Result>;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
  resetOnSuccess?: boolean;
  successLabel?: string;
}) {
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      ref={ref}
      className={clsx('space-y-3', className)}
      action={(fd) => {
        setMsg(null);
        start(async () => {
          const res = await action(fd);
          if (res.ok) {
            setMsg({ ok: true, text: successLabel });
            if (resetOnSuccess) ref.current?.reset();
            router.refresh();
          } else {
            setMsg({ ok: false, text: res.error });
          }
        });
      }}
    >
      {children}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? 'Saving…' : submitLabel}
        </button>
        {msg && (
          <span className={clsx('text-sm', msg.ok ? 'text-forest-700' : 'text-red-600')}>
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}

export function Field({
  label,
  name,
  defaultValue,
  type = 'text',
  placeholder,
  required,
  step,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        className="field mt-1"
      />
      {hint && <span className="mt-0.5 block text-xs text-ink-400">{hint}</span>}
    </label>
  );
}

export function Toggle({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-forest-600" />
      {label}
    </label>
  );
}

export function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select name={name} defaultValue={defaultValue} className="field mt-1">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
