import {
  assertTransition,
  finalizeWeightedLine,
  formatOrderNumber,
  tryReserve,
} from '@oasisa2/commerce';
import { prisma, Prisma } from '@oasisa2/database';
import type { CheckoutInput, orderStatusUpdateSchema } from '@oasisa2/validation';
import type { z } from 'zod';
import { getCartView } from './cart';

export class CheckoutError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

/**
 * Turn an active cart into an order. Everything money-related is recomputed from
 * getCartView (server-side). Inventory is reserved inside the transaction with a
 * row lock to prevent overselling.
 */
export async function createOrderFromCart(params: {
  cartId: string;
  userId?: string | null;
  input: CheckoutInput;
}) {
  const view = await getCartView(params.cartId);
  if (!view) throw new CheckoutError('Cart not found', 'cart_not_found');
  if (view.lines.length === 0) throw new CheckoutError('Cart is empty', 'cart_empty');
  if (view.totals.couponError) {
    throw new CheckoutError(`Coupon problem: ${view.totals.couponError}`, 'coupon_invalid');
  }
  if (params.input.fulfillmentType !== view.fulfillmentType) {
    throw new CheckoutError('Fulfillment type mismatch', 'fulfillment_mismatch');
  }
  if (view.fulfillmentType === 'DELIVERY') {
    if (!view.totals.deliveryEligible) {
      throw new CheckoutError('Delivery is not available for this address', 'delivery_ineligible');
    }
    if (!view.totals.meetsDeliveryMinimum) {
      throw new CheckoutError('Order is below the delivery minimum', 'below_minimum');
    }
    if (!params.input.address) {
      throw new CheckoutError('Delivery address is required', 'address_required');
    }
  }

  const cart = await prisma.cart.findUniqueOrThrow({
    where: { id: params.cartId },
    include: { items: { include: { product: true, variant: true } }, store: true },
  });
  const activeItems = cart.items.filter((i) => !i.savedForLater);

  return prisma.$transaction(async (tx) => {
    // slot capacity check + reserve
    const slot = await tx.fulfillmentSlot.findUnique({ where: { id: params.input.slotId } });
    if (!slot || slot.storeId !== cart.storeId || slot.type !== view.fulfillmentType) {
      throw new CheckoutError('Selected time slot is not valid', 'slot_invalid');
    }
    if (!slot.isActive || slot.reservedCount >= slot.capacity) {
      throw new CheckoutError('Selected time slot is full', 'slot_full');
    }
    await tx.fulfillmentSlot.update({
      where: { id: slot.id },
      data: {
        reservedCount: { increment: 1 },
        status: slot.reservedCount + 1 >= slot.capacity ? 'FULL' : 'OPEN',
      },
    });

    // inventory reservation (each-priced items only; weighted items are prepared to order)
    for (const item of activeItems) {
      if (item.product.unitType !== 'EACH') continue;
      const inv = await tx.storeInventory.findFirst({
        where: { storeId: cart.storeId, productId: item.productId, variantId: item.variantId ?? null },
      });
      if (!inv) continue;
      const result = tryReserve(
        {
          state: inv.state,
          quantityOnHand: inv.quantityOnHand,
          quantityReserved: inv.quantityReserved,
          lowStockThreshold: inv.lowStockThreshold,
        },
        item.quantity,
      );
      if (!result.ok) {
        throw new CheckoutError(`${item.product.name} is out of stock`, 'insufficient_stock');
      }
      await tx.storeInventory.update({
        where: { id: inv.id },
        data: { quantityReserved: { increment: item.quantity } },
      });
      await tx.inventoryAdjustment.create({
        data: {
          storeId: cart.storeId,
          productId: item.productId,
          reason: 'ONLINE_ORDER_RESERVED',
          quantityDelta: -item.quantity,
          quantityAfter: inv.quantityOnHand - inv.quantityReserved - item.quantity,
        },
      });
    }

    // address
    let addressId: string | null = null;
    if (view.fulfillmentType === 'DELIVERY' && params.input.address) {
      const a = params.input.address;
      const created = await tx.address.create({
        data: {
          userId: params.userId ?? null,
          recipientName: a.recipientName,
          phone: a.phone,
          line1: a.line1,
          line2: a.line2 ?? null,
          city: a.city,
          state: a.state,
          postalCode: a.postalCode,
          gateCode: a.gateCode ?? null,
          deliveryInstructions: a.deliveryInstructions ?? null,
        },
      });
      addressId = created.id;
    }

    const seq = await tx.order.count();
    const t = view.totals;

    const order = await tx.order.create({
      data: {
        orderNumber: formatOrderNumber(seq),
        userId: params.userId ?? null,
        cartId: cart.id,
        storeId: cart.storeId,
        contactName: params.input.contactName,
        contactEmail: params.input.contactEmail ?? null,
        contactPhone: params.input.contactPhone,
        fulfillmentType: view.fulfillmentType,
        slotId: slot.id,
        addressId,
        deliveryInstructions: params.input.deliveryInstructions ?? null,
        contactless: params.input.contactless ?? false,
        leaveAtDoor: params.input.leaveAtDoor ?? false,
        subtotalCents: t.subtotalCents,
        discountCents: t.discountCents,
        deliveryFeeCents: t.deliveryFeeCents,
        taxCents: t.taxCents,
        tipCents: t.tipCents,
        estimatedTotalCents: t.estimatedTotalCents,
        couponCode: view.couponCode,
        customerNote: params.input.customerNote ?? null,
        items: {
          create: activeItems.map((item) => {
            const line = view.lines.find((l) => l.id === item.id)!;
            return {
              productId: item.productId,
              variantId: item.variantId ?? null,
              nameSnapshot: item.product.name,
              skuSnapshot: item.variant?.sku ?? item.product.sku,
              unitType: item.product.unitType,
              quantity: item.quantity,
              requestedWeightLb: item.requestedWeightLb ?? null,
              unitPriceCents: line.unitPriceCents,
              estimatedLineCents:
                view.totals.lines.find((tl) => tl.lineId === item.id)?.netLineCents ?? 0,
              lineDiscountCents:
                view.totals.lines.find((tl) => tl.lineId === item.id)?.discountCents ?? 0,
              substitution: item.substitution,
              butcherInstruction:
                item.butcherSelections || item.butcherNotes
                  ? {
                      create: {
                        selections: (item.butcherSelections ?? {}) as Prisma.InputJsonValue,
                        notes: item.butcherNotes ?? null,
                      },
                    }
                  : undefined,
            };
          }),
        },
        statusHistory: { create: [{ status: 'RECEIVED', changedById: params.userId ?? null }] },
        payments: {
          create: {
            provider: 'STRIPE',
            status: 'REQUIRES_PAYMENT',
            amountCents: t.estimatedTotalCents,
          },
        },
      },
      include: { items: true, payments: true },
    });

    await tx.cart.update({ where: { id: cart.id }, data: { status: 'CONVERTED' } });

    return order;
  });
}

export async function listOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { placedAt: 'desc' },
    include: { items: true, store: true, slot: true },
  });
}

export async function getOrder(orderNumber: string, userId?: string | null) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: { include: { product: { include: { images: true } }, butcherInstruction: true } },
      store: true,
      slot: true,
      address: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
      payments: true,
    },
  });
  if (!order) return null;
  if (userId && order.userId && order.userId !== userId) return null;
  return order;
}

/** Items a repeat customer buys — powers "Buy Again". */
export async function getBuyAgainItems(userId: string, storeId: string, limit = 12) {
  const items = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: { order: { userId, status: { in: ['COMPLETED', 'DELIVERED'] } } },
    _count: { productId: true },
    orderBy: { _count: { productId: 'desc' } },
    take: limit,
  });
  const productIds = items.map((i) => i.productId);
  if (!productIds.length) return [];
  const { toProductCard } = await import('./catalog');
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: {
      brand: true,
      department: true,
      category: true,
      images: { where: { isPrimary: true }, take: 1 },
      prices: true,
      inventory: true,
    },
  });
  return products.map((p) =>
    toProductCard(
      {
        ...p,
        brand: p.brand ? { name: p.brand.name } : null,
        department: { slug: p.department.slug },
        category: { slug: p.category.slug },
        images: p.images.map((i) => ({ url: i.url })),
      } as never,
      storeId,
    ),
  );
}

export async function updateOrderStatus(
  input: z.infer<typeof orderStatusUpdateSchema>,
  actorId: string | null,
) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: input.orderId } });
  assertTransition(order.status, input.status);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: input.status,
        confirmedAt: input.status === 'CONFIRMED' ? new Date() : undefined,
        readyAt: input.status === 'READY_FOR_PICKUP' ? new Date() : undefined,
        completedAt: input.status === 'COMPLETED' ? new Date() : undefined,
        cancelledAt: input.status === 'CANCELLED' ? new Date() : undefined,
      },
    });
    await tx.orderStatusHistory.create({
      data: { orderId: order.id, status: input.status, note: input.note, changedById: actorId },
    });
    return updated;
  });
}

/** Butcher / picker records the actual prepared weight; line + order totals adjust. */
export async function recordActualWeight(orderItemId: string, actualWeightLb: number, staffId: string) {
  const item = await prisma.orderItem.findUniqueOrThrow({
    where: { id: orderItemId },
    include: { butcherInstruction: true },
  });
  if (item.unitType !== 'WEIGHT') throw new Error('Not a weighted item');

  const result = finalizeWeightedLine(
    item.unitPriceCents,
    actualWeightLb,
    item.estimatedLineCents,
  );

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.update({
      where: { id: item.id },
      data: {
        actualWeightLb: new Prisma.Decimal(actualWeightLb),
        finalLineCents: result.finalLineCents,
        status: 'BUTCHER_DONE',
        butcheredById: staffId,
      },
    });
    if (item.butcherInstruction) {
      await tx.butcherInstruction
        .update({ where: { orderItemId: item.id }, data: { completedAt: new Date(), butcherId: staffId } })
        .catch(() => undefined);
    }

    // recompute order final total from all lines
    const items = await tx.orderItem.findMany({ where: { orderId: item.orderId } });
    const order = await tx.order.findUniqueOrThrow({ where: { id: item.orderId } });
    const lineSum = items.reduce(
      (acc, i) => acc + (i.finalLineCents ?? i.estimatedLineCents),
      0,
    );
    const finalTotal = lineSum + order.deliveryFeeCents + order.taxCents + order.tipCents;
    await tx.order.update({ where: { id: order.id }, data: { finalTotalCents: finalTotal } });
  });

  return result;
}
