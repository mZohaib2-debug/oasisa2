import 'server-only';
import { getOrCreateCart, getCartView, type CartView } from '@oasisa2/api';
import { getSessionUserId, peekAnonymousId, getOrCreateAnonymousId } from './session';
import { readStoreCookie } from './store-context';
import { DEFAULT_STORE_SLUG } from '@oasisa2/config';

/** Resolve (creating if needed) the current visitor's active cart id. */
export async function resolveCartId(createAnon = false): Promise<string> {
  const userId = await getSessionUserId();
  const anonymousId = userId
    ? null
    : createAnon
      ? await getOrCreateAnonymousId()
      : await peekAnonymousId();
  const cookie = await readStoreCookie();

  const cart = await getOrCreateCart({
    userId,
    anonymousId,
    storeSlug: cookie?.storeSlug ?? DEFAULT_STORE_SLUG,
    fulfillmentType: cookie?.fulfillmentType ?? 'PICKUP',
    deliveryPostalCode: cookie?.deliveryPostalCode ?? null,
  });
  return cart.id;
}

/** Priced cart view for rendering. Returns null (empty) when no cart yet. */
export async function getActiveCartView(): Promise<CartView | null> {
  const userId = await getSessionUserId();
  const anonymousId = userId ? null : await peekAnonymousId();
  if (!userId && !anonymousId) return null;
  const cartId = await resolveCartId(false);
  return getCartView(cartId);
}

export async function getCartItemCount(): Promise<number> {
  const view = await getActiveCartView();
  return view?.totals.itemCount ?? 0;
}
