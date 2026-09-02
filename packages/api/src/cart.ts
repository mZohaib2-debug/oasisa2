import {
  applyVariantDelta,
  computeCartTotals,
  type CartLineInput,
  type CartTotals,
} from '@oasisa2/commerce';
import { prisma, type Prisma } from '@oasisa2/database';
import type { AddToCartInput } from '@oasisa2/validation';
import { getActivePromotions, resolvePrice } from './pricing';
import { resolveStoreContext } from './store-context';

/** Find-or-create the active cart for a user or an anonymous device id. */
export async function getOrCreateCart(params: {
  userId?: string | null;
  anonymousId?: string | null;
  storeSlug: string;
  fulfillmentType: 'PICKUP' | 'DELIVERY';
  deliveryPostalCode?: string | null;
}) {
  const store = await prisma.store.findUniqueOrThrow({ where: { slug: params.storeSlug } });

  const existing = await prisma.cart.findFirst({
    where: {
      status: 'ACTIVE',
      ...(params.userId
        ? { userId: params.userId }
        : { anonymousId: params.anonymousId ?? '__none__' }),
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (existing) {
    if (
      existing.storeId !== store.id ||
      existing.fulfillmentType !== params.fulfillmentType ||
      (params.deliveryPostalCode ?? null) !== existing.deliveryPostalCode
    ) {
      return prisma.cart.update({
        where: { id: existing.id },
        data: {
          storeId: store.id,
          fulfillmentType: params.fulfillmentType,
          deliveryPostalCode: params.deliveryPostalCode ?? null,
        },
      });
    }
    return existing;
  }

  return prisma.cart.create({
    data: {
      userId: params.userId ?? null,
      anonymousId: params.userId ? null : (params.anonymousId ?? null),
      storeId: store.id,
      fulfillmentType: params.fulfillmentType,
      deliveryPostalCode: params.deliveryPostalCode ?? null,
    },
  });
}

const cartInclude = {
  items: {
    include: {
      product: {
        include: {
          brand: true,
          department: true,
          category: true,
          images: { where: { isPrimary: true }, take: 1 },
          prices: true,
          inventory: true,
        },
      },
      variant: true,
    },
  },
  store: true,
} satisfies Prisma.CartInclude;

export type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export async function addItem(cartId: string, input: AddToCartInput) {
  const cart = await prisma.cart.findUniqueOrThrow({ where: { id: cartId } });
  const product = await prisma.product.findUniqueOrThrow({ where: { id: input.productId } });

  if (product.unitType === 'WEIGHT' && !input.requestedWeightLb) {
    throw new Error('requestedWeightLb is required for weighted items');
  }
  if (product.unitType === 'EACH' && input.requestedWeightLb) {
    throw new Error('requestedWeightLb is not valid for each-priced items');
  }

  const existing = await prisma.cartItem.findFirst({
    where: { cartId, productId: input.productId, variantId: input.variantId ?? null },
  });

  const data = {
    quantity: input.quantity ?? 1,
    requestedWeightLb: input.requestedWeightLb ?? null,
    butcherSelections: input.butcherSelections ?? undefined,
    butcherNotes: input.butcherNotes ?? null,
    substitution: input.substitution ?? 'BEST_SUBSTITUTE',
  } satisfies Prisma.CartItemUncheckedUpdateInput;

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        ...data,
        quantity:
          product.unitType === 'EACH'
            ? existing.quantity + (input.quantity ?? 1)
            : (input.quantity ?? 1),
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId,
        productId: input.productId,
        variantId: input.variantId ?? null,
        ...data,
      },
    });
  }
  await prisma.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });
  return getCart(cart.id);
}

export async function removeItem(cartId: string, cartItemId: string) {
  await prisma.cartItem.deleteMany({ where: { id: cartItemId, cartId } });
  return getCart(cartId);
}

export async function setItemQuantity(cartId: string, cartItemId: string, quantity: number) {
  if (quantity <= 0) return removeItem(cartId, cartItemId);
  await prisma.cartItem.updateMany({ where: { id: cartItemId, cartId }, data: { quantity } });
  return getCart(cartId);
}

export async function getCart(cartId: string): Promise<CartWithItems | null> {
  return prisma.cart.findUnique({ where: { id: cartId }, include: cartInclude });
}

export interface CartView {
  id: string;
  storeSlug: string;
  fulfillmentType: 'PICKUP' | 'DELIVERY';
  deliveryPostalCode: string | null;
  couponCode: string | null;
  lines: {
    id: string;
    productId: string;
    slug: string;
    name: string;
    brandName: string | null;
    imageUrl: string | null;
    unitType: 'EACH' | 'WEIGHT';
    variantName: string | null;
    quantity: number;
    requestedWeightLb: number | null;
    unitPriceCents: number;
    butcherSelections: unknown;
    butcherNotes: string | null;
    substitution: string;
    savedForLater: boolean;
  }[];
  totals: CartTotals;
}

/** Build the fully-priced cart view. All money computed here, server-side. */
export async function getCartView(cartId: string): Promise<CartView | null> {
  const cart = await getCart(cartId);
  if (!cart) return null;

  const ctx = await resolveStoreContext({
    storeSlug: cart.store.slug,
    fulfillmentType: cart.fulfillmentType,
    deliveryPostalCode: cart.deliveryPostalCode,
  });
  const promotions = await getActivePromotions(cart.storeId);

  const active = cart.items.filter((i) => !i.savedForLater);

  const lineInputs: CartLineInput[] = active.map((item) => {
    const price = resolvePrice(item.product, cart.storeId);
    const unitPriceCents = applyVariantDelta(
      price.unitPriceCents,
      item.variant?.priceDeltaCents ?? 0,
    );
    return {
      lineId: item.id,
      productId: item.productId,
      categoryId: item.product.categoryId,
      departmentId: item.product.departmentId,
      name: item.product.name,
      unitType: item.product.unitType,
      taxable: item.product.taxStatus === 'TAXABLE',
      unitPriceCents,
      quantity: item.quantity,
      requestedWeightLb: item.requestedWeightLb ? Number(item.requestedWeightLb) : null,
    };
  });

  let coupon = null;
  if (cart.couponCode) {
    const c = await prisma.coupon.findUnique({ where: { code: cart.couponCode } });
    if (c) {
      coupon = {
        code: c.code,
        type: c.type as 'PERCENT_OFF' | 'AMOUNT_OFF' | 'FREE_DELIVERY',
        value: c.value,
        minSubtotalCents: c.minSubtotalCents,
        isActive: c.isActive,
        startsAt: c.startsAt,
        endsAt: c.endsAt,
        maxRedemptions: c.maxRedemptions,
        redemptionCount: c.redemptionCount,
      };
    }
  }

  const totals = computeCartTotals({
    lines: lineInputs,
    fulfillmentType: cart.fulfillmentType,
    storeState: cart.store.state,
    promotions,
    coupon,
    deliveryQuote: ctx?.deliveryQuote ?? null,
  });

  return {
    id: cart.id,
    storeSlug: cart.store.slug,
    fulfillmentType: cart.fulfillmentType,
    deliveryPostalCode: cart.deliveryPostalCode,
    couponCode: cart.couponCode,
    lines: active.map((item, idx) => ({
      id: item.id,
      productId: item.productId,
      slug: item.product.slug,
      name: item.product.name,
      brandName: item.product.brand?.name ?? null,
      imageUrl: item.product.images[0]?.url ?? null,
      unitType: item.product.unitType,
      variantName: item.variant?.name ?? null,
      quantity: item.quantity,
      requestedWeightLb: item.requestedWeightLb ? Number(item.requestedWeightLb) : null,
      unitPriceCents: lineInputs[idx]!.unitPriceCents,
      butcherSelections: item.butcherSelections,
      butcherNotes: item.butcherNotes,
      substitution: item.substitution,
      savedForLater: item.savedForLater,
    })),
    totals,
  };
}

export async function applyCoupon(cartId: string, code: string | null) {
  await prisma.cart.update({
    where: { id: cartId },
    data: { couponCode: code ? code.trim().toUpperCase() : null },
  });
  return getCartView(cartId);
}
