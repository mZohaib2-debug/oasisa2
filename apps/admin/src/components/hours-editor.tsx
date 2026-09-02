'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateHoursAction } from '@/app/actions';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Day {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
}

export function HoursEditor({ slug, hours }: { slug: string; hours: Day[] }) {
  const router = useRouter();
  const byDay = new Map(hours.map((h) => [h.dayOfWeek, h]));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <form
      action={(fd) => {
        setMsg(null);
        start(async () => {
          const res = await updateHoursAction(slug, fd);
          setMsg(res.ok ? 'Saved.' : res.error);
          if (res.ok) router.refresh();
        });
      }}
      className="space-y-2"
    >
      {DAYS.map((name, day) => {
        const h = byDay.get(day);
        return (
          <div key={day} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="w-24 font-medium text-ink-700">{name}</span>
            <label className="flex items-center gap-1">
              <input type="checkbox" name={`closed-${day}`} defaultChecked={h?.isClosed ?? false} />
              Closed
            </label>
            <input
              type="time"
              name={`opensAt-${day}`}
              defaultValue={h?.opensAt ?? '09:00'}
              className="field w-32 py-1"
            />
            <span>to</span>
            <input
              type="time"
              name={`closesAt-${day}`}
              defaultValue={h?.closesAt ?? '21:00'}
              className="field w-32 py-1"
            />
          </div>
        );
      })}
      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? 'Saving…' : 'Save hours'}
        </button>
        {msg && <span className="text-sm text-ink-500">{msg}</span>}
      </div>
    </form>
  );
}
