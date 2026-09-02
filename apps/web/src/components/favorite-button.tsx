'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import clsx from 'clsx';
import { toggleFavoriteAction } from '@/app/actions';

export function FavoriteButton({
  productId,
  initial = false,
}: {
  productId: string;
  initial?: boolean;
}) {
  const [favorited, setFavorited] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={favorited}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleFavoriteAction(productId);
          if (res.ok && res.data && typeof res.data === 'object' && 'favorited' in res.data) {
            setFavorited(Boolean((res.data as { favorited: boolean }).favorited));
          }
        })
      }
      disabled={pending}
      className="rounded-full bg-white/90 p-1.5 shadow-sm ring-1 ring-charcoal-700/10 transition hover:bg-white"
    >
      <Heart
        className={clsx('h-4 w-4', favorited ? 'fill-forest-600 text-forest-600' : 'text-charcoal-700/60')}
      />
    </button>
  );
}
