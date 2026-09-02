import clsx from 'clsx';
import { formatCents } from '@/lib/format';

export function Price({
  unitPriceCents,
  wasPriceCents,
  unitType,
  size = 'md',
  className,
}: {
  unitPriceCents: number;
  wasPriceCents?: number | null;
  unitType: 'EACH' | 'WEIGHT';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const suffix = unitType === 'WEIGHT' ? '/lb' : '';
  return (
    <div className={clsx('flex items-baseline gap-2', className)}>
      <span
        className={clsx(
          'font-bold text-charcoal-900',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-2xl',
          wasPriceCents && 'text-forest-700',
        )}
      >
        {formatCents(unitPriceCents)}
        {suffix && <span className="text-xs font-semibold">{suffix}</span>}
      </span>
      {wasPriceCents ? (
        <span className="text-xs font-medium text-charcoal-700/60 line-through">
          {formatCents(wasPriceCents)}
          {suffix}
        </span>
      ) : null}
    </div>
  );
}
