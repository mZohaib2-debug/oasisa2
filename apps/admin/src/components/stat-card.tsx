import clsx from 'clsx';

export function StatCard({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'default' | 'warn' | 'good';
}) {
  return (
    <div className="card p-4">
      <p className="label">{label}</p>
      <p
        className={clsx(
          'mt-1 text-2xl font-bold',
          tone === 'warn' && 'text-amber-700',
          tone === 'good' && 'text-forest-700',
          tone === 'default' && 'text-ink-900',
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-ink-500">{sub}</p>}
    </div>
  );
}

export function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return <span className={clsx('badge', tone)}>{children}</span>;
}
