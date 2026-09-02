'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import {
  addItem,
  applyCoupon as applyCouponSvc,
  checkDeliveryEligibility,
  createOrderFromCart,
  removeItem,
  setItemQuantity,
  CheckoutError,
} from '@oasisa2/api';
import { prisma } from '@oasisa2/database';
import {
  addToCartSchema,
  applyCouponSchema,
  checkoutSchema,
  credentialsSchema,
  registerSchema,
  storeContextSchema,
} from '@oasisa2/validation';
import { resolveCartId } from '@/lib/cart';
import { getSessionUserId, setSession, clearSession, getOrCreateAnonymousId } from '@/lib/session';
import { writeStoreCookie } from '@/lib/store-context';

export type ActionResult = { ok: true; data?: unknown } | { ok: false; error: string };

export async function selectStoreAction(formData: FormData): Promise<ActionResult> {
  const parsed = storeContextSchema.safeParse({
    storeSlug: formData.get('storeSlug'),
    fulfillmentType: formData.get('fulfillmentType'),
    deliveryPostalCode: formData.get('deliveryPostalCode') || undefined,
  });
  if (!parsed.success) return { ok: false, error: 'Please choose a store and how you want to shop.' };

  if (parsed.data.fulfillmentType === 'DELIVERY') {
    if (!parsed.data.deliveryPostalCode) {
      return { ok: false, error: 'Enter your ZIP code to check delivery.' };
    }
    const quote = await checkDeliveryEligibility(
      parsed.data.storeSlug,
      parsed.data.deliveryPostalCode,
    );
    if (!quote?.eligible) {
      return {
        ok: false,
        error: `Sorry — the ${parsed.data.storeSlug.replace('-', ' ')} branch does not deliver to ${parsed.data.deliveryPostalCode} yet. Try pickup instead.`,
      };
    }
  }

  await writeStoreCookie(parsed.data);
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function checkDeliveryAction(
  storeSlug: string,
  postalCode: string,
): Promise<ActionResult> {
  const quote = await checkDeliveryEligibility(storeSlug, postalCode);
  if (!quote) return { ok: false, error: 'Store not found.' };
  return { ok: true, data: quote };
}

export async function addToCartAction(input: unknown): Promise<ActionResult> {
  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'That item could not be added.' };
  await getOrCreateAnonymousId();
  const cartId = await resolveCartId(true);
  try {
    await addItem(cartId, parsed.data);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not add to cart.' };
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function updateCartItemAction(
  cartItemId: string,
  quantity: number,
): Promise<ActionResult> {
  const cartId = await resolveCartId(false);
  await setItemQuantity(cartId, cartItemId, quantity);
  revalidatePath('/cart');
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function removeCartItemAction(cartItemId: string): Promise<ActionResult> {
  const cartId = await resolveCartId(false);
  await removeItem(cartId, cartItemId);
  revalidatePath('/cart');
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function applyCouponAction(code: string | null): Promise<ActionResult> {
  const cartId = await resolveCartId(false);
  if (code) {
    const parsed = applyCouponSchema.safeParse({ code });
    if (!parsed.success) return { ok: false, error: 'Enter a valid code.' };
  }
  const view = await applyCouponSvc(cartId, code);
  if (code && view?.totals.couponError) {
    return { ok: false, error: `Coupon ${code}: ${view.totals.couponError.replace(/_/g, ' ')}` };
  }
  revalidatePath('/cart');
  return { ok: true };
}

export async function checkoutAction(input: unknown): Promise<ActionResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check your details.' };
  }
  const userId = await getSessionUserId();
  const cartId = await resolveCartId(false);

  let orderNumber: string;
  try {
    const order = await createOrderFromCart({ cartId, userId, input: parsed.data });
    orderNumber = order.orderNumber;
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, error: e.message };
    return { ok: false, error: 'Checkout failed. Please try again.' };
  }

  if (parsed.data.createAccount && parsed.data.password && parsed.data.contactEmail && !userId) {
    try {
      const passwordHash = await bcrypt.hash(parsed.data.password, 10);
      const [firstName, ...rest] = parsed.data.contactName.split(' ');
      const user = await prisma.user.create({
        data: {
          email: parsed.data.contactEmail.toLowerCase(),
          passwordHash,
          firstName: firstName ?? parsed.data.contactName,
          lastName: rest.join(' ') || null,
          role: 'CUSTOMER',
          customerProfile: { create: {} },
        },
      });
      await prisma.order.updateMany({ where: { orderNumber }, data: { userId: user.id } });
      await setSession(user.id);
    } catch {
      // email already exists etc. — order still placed as guest
    }
  }

  revalidatePath('/', 'layout');
  return { ok: true, data: { orderNumber } };
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { ok: false, error: 'Enter your email and password.' };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user?.passwordHash || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return { ok: false, error: 'Email or password is incorrect.' };
  }
  await setSession(user.id);
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check your details.' };
  }
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) return { ok: false, error: 'An account with that email already exists.' };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      role: 'CUSTOMER',
      customerProfile: { create: {} },
    },
  });
  await setSession(user.id);
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function toggleFavoriteAction(productId: string): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: 'Sign in to save favorites.' };
  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { userId, productId } });
  }
  revalidatePath('/account/favorites');
  return { ok: true, data: { favorited: !existing } };
}

export async function addListToCartAction(listId: string): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: 'Sign in to use saved lists.' };
  const list = await prisma.savedList.findFirst({
    where: { id: listId, userId },
    include: { items: { include: { product: true } } },
  });
  if (!list) return { ok: false, error: 'List not found.' };

  const cartId = await resolveCartId(true);
  for (const item of list.items) {
    try {
      await addItem(cartId, {
        productId: item.productId,
        quantity: item.product.unitType === 'EACH' ? item.quantity : undefined,
        requestedWeightLb:
          item.product.unitType === 'WEIGHT'
            ? Number(item.requestedWeightLb ?? item.product.averageWeightLb ?? 1)
            : undefined,
      });
    } catch {
      // skip unavailable items
    }
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function reorderAction(orderNumber: string): Promise<ActionResult> {
  const userId = await getSessionUserId();
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: { include: { product: true } } },
  });
  if (!order || (userId && order.userId && order.userId !== userId)) {
    return { ok: false, error: 'Order not found.' };
  }
  const cartId = await resolveCartId(true);
  for (const item of order.items) {
    try {
      await addItem(cartId, {
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        quantity: item.unitType === 'EACH' ? item.quantity : undefined,
        requestedWeightLb:
          item.unitType === 'WEIGHT'
            ? Number(item.requestedWeightLb ?? item.product.averageWeightLb ?? 1)
            : undefined,
      });
    } catch {
      // skip
    }
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}
