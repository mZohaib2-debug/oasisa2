import clsx from 'clsx';

const HUES: [string, string][] = [
  ['#dcecdf', '#245036'],
  ['#f2e8cf', '#a37f2f'],
  ['#e3ede8', '#2c6440'],
  ['#f6eee0', '#8a6d2b'],
  ['#e8f0ea', '#1f402d'],
];

function hueFor(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return HUES[h % HUES.length]!;
}

/**
 * Demo catalog has no photography. Renders a branded, deterministic placeholder
 * from the product name so cards and galleries look intentional, not broken.
 */
export function ProductImage({
  name,
  className,
  rounded = true,
}: {
  name: string;
  className?: string;
  rounded?: boolean;
}) {
  const [bg, fg] = hueFor(name);
  const initials = name
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div
      className={clsx(
        'flex items-center justify-center overflow-hidden',
        rounded && 'rounded-lg',
        className,
      )}
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      <span className="select-none text-2xl font-bold tracking-tight" style={{ color: fg }}>
        {initials || 'OA2'}
      </span>
    </div>
  );
}
