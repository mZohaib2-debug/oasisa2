import 'server-only';
import { cookies } from 'next/headers';
import { DEFAULT_STORE_SLUG } from '@oasisa2/config';
import { resolveStoreContext, type ResolvedStoreContext } from '@oasisa2/api';
import type { FulfillmentType } from '@oasisa2/types';

const STORE_COOKIE = 'oa2_store';

export interface StoreCookieValue {
  storeSlug: string;
  fulfillmentType: FulfillmentType;
  deliveryPostalCode?: string;
}

export async function readStoreCookie(): Promise<StoreCookieValue | null> {
  const jar = await cookies();
  const raw = jar.get(STORE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoreCookieValue;
    if (!parsed.storeSlug || !parsed.fulfillmentType) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeStoreCookie(value: StoreCookieValue): Promise<void> {
  const jar = await cookies();
  jar.set(STORE_COOKIE, JSON.stringify(value), {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  });
}

/** Whether the visitor has chosen a store/fulfillment yet. */
export async function hasStoreContext(): Promise<boolean> {
  return (await readStoreCookie()) !== null;
}

/**
 * The resolved store context for the current request. Falls back to the default
 * branch + pickup so pages always render; `chosen` says if the visitor picked.
 */
export async function getStoreContext(): Promise<ResolvedStoreContext & { chosen: boolean }> {
  const cookie = await readStoreCookie();
  const ctx = await resolveStoreContext({
    storeSlug: cookie?.storeSlug ?? DEFAULT_STORE_SLUG,
    fulfillmentType: cookie?.fulfillmentType ?? 'PICKUP',
    deliveryPostalCode: cookie?.deliveryPostalCode ?? null,
  });
  if (!ctx) {
    const fallback = await resolveStoreContext({
      storeSlug: DEFAULT_STORE_SLUG,
      fulfillmentType: 'PICKUP',
    });
    return { ...(fallback as ResolvedStoreContext), chosen: false };
  }
  return { ...ctx, chosen: cookie !== null };
}
