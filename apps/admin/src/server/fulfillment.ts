import 'server-only';
import { assertTransition } from '@oasisa2/commerce';
import { prisma, type OrderItemStatus, type OrderStatus } from '@oasisa2/database';
import { finalizeReservation } from '@oasisa2/commerce';

/** Set one order item's fulfilment status (picker actions). */
export async function setItemStatus(params: {
  orderItemId: string;
  status: OrderItemStatus;
  staffId: string;
  substitutedWithProductId?: string | null;
  substitutionNote?: string | null;
}) {
  const item = await prisma.orderItem.findUniqueOrThrow({ where: { id: params.orderItemId } });

  await prisma.orderItem.update({
    where: { id: item.id },
    data: {
      status: params.status,
      pickedById: params.staffId,
      pickedAt: new Date(),
      substitutedWithProductId: params.substitutedWithProductId ?? undefined,
      substitutionNote: params.substitutionNote ?? undefined,
    },
  });

  await maybeAdvanceOrder(item.orderId, params.staffId);
}

/** When every item is resolved, move the order forward automatically. */
async function maybeAdvanceOrder(orderId: string, staffId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  });
  if (['PACKED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'].includes(order.status)) {
    return;
  }

  const items = order.items;
  const anyToButcher = items.some((i) => i.status === 'SENT_TO_BUTCHER');
  const allResolved = items.every((i) =>
    ['PICKED', 'SUBSTITUTED', 'NOT_AVAILABLE', 'BUTCHER_DONE', 'PACKED'].includes(i.status),
  );

  let next: OrderStatus | null = null;
  if (anyToButcher && order.status !== 'BUTCHER_PREPARING') next = 'BUTCHER_PREPARING';
  else if (allResolved && !anyToButcher && order.status !== 'PREPARING') next = 'PREPARING';
  else if (order.status === 'CONFIRMED') next = 'PICKING';

  if (next && next !== order.status) {
    try {
      assertTransition(order.status, next);
      await prisma.order.update({ where: { id: orderId }, data: { status: next } });
      await prisma.orderStatusHistory.create({
        data: { orderId, status: next, changedById: staffId, note: 'Auto-advanced by fulfilment' },
      });
    } catch {
      /* illegal transition — leave as-is */
    }
  }
}

export async function transitionOrder(params: {
  orderId: string;
  to: OrderStatus;
  staffId: string;
  note?: string;
}) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: params.orderId },
    include: { items: true, store: true },
  });
  assertTransition(order.status, params.to);

  await prisma.$transaction(async (tx) => {
    // Releasing / finalizing inventory reservations on terminal transitions.
    if (params.to === 'CANCELLED') {
      for (const item of order.items) {
        if (item.unitType !== 'EACH') continue;
        const inv = await tx.storeInventory.findFirst({
          where: { storeId: order.storeId, productId: item.productId, variantId: item.variantId ?? null },
        });
        if (inv && inv.quantityReserved > 0) {
          await tx.storeInventory.update({
            where: { id: inv.id },
            data: { quantityReserved: { decrement: Math.min(item.quantity, inv.quantityReserved) } },
          });
          await tx.inventoryAdjustment.create({
            data: {
              storeId: order.storeId,
              productId: item.productId,
              reason: 'ONLINE_ORDER_RELEASED',
              quantityDelta: Math.min(item.quantity, inv.quantityReserved),
              quantityAfter: inv.quantityOnHand,
              orderId: order.id,
              createdById: params.staffId,
            },
          });
        }
      }
    }
    if (params.to === 'PACKED') {
      for (const item of order.items) {
        if (item.unitType !== 'EACH' || item.status === 'NOT_AVAILABLE') continue;
        const inv = await tx.storeInventory.findFirst({
          where: { storeId: order.storeId, productId: item.productId, variantId: item.variantId ?? null },
        });
        if (inv) {
          const fin = finalizeReservation(
            {
              state: inv.state,
              quantityOnHand: inv.quantityOnHand,
              quantityReserved: inv.quantityReserved,
              lowStockThreshold: inv.lowStockThreshold,
            },
            item.quantity,
          );
          await tx.storeInventory.update({
            where: { id: inv.id },
            data: {
              quantityOnHand: fin.quantityOnHandAfter,
              quantityReserved: fin.quantityReservedAfter,
              state:
                fin.quantityOnHandAfter - fin.quantityReservedAfter <= 0
                  ? 'OUT_OF_STOCK'
                  : fin.quantityOnHandAfter - fin.quantityReservedAfter <= inv.lowStockThreshold
                    ? 'LOW_STOCK'
                    : 'IN_STOCK',
            },
          });
          await tx.inventoryAdjustment.create({
            data: {
              storeId: order.storeId,
              productId: item.productId,
              reason: 'ONLINE_ORDER_FULFILLED',
              quantityDelta: -item.quantity,
              quantityAfter: fin.quantityOnHandAfter,
              orderId: order.id,
              createdById: params.staffId,
            },
          });
        }
      }
      // recompute final total from line finals
      const lineSum = order.items
        .filter((i) => i.status !== 'NOT_AVAILABLE')
        .reduce((acc, i) => acc + (i.finalLineCents ?? i.estimatedLineCents), 0);
      await tx.order.update({
        where: { id: order.id },
        data: { finalTotalCents: lineSum + order.deliveryFeeCents + order.taxCents + order.tipCents },
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: params.to,
        confirmedAt: params.to === 'CONFIRMED' ? new Date() : undefined,
        readyAt: params.to === 'READY_FOR_PICKUP' ? new Date() : undefined,
        completedAt: params.to === 'COMPLETED' ? new Date() : undefined,
        cancelledAt: params.to === 'CANCELLED' ? new Date() : undefined,
      },
    });
    await tx.orderStatusHistory.create({
      data: { orderId: order.id, status: params.to, changedById: params.staffId, note: params.note },
    });
  });
}
