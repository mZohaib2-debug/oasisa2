import 'server-only';
import { deriveInventoryState } from '@oasisa2/commerce';
import { prisma, type InventoryAdjustmentReason } from '@oasisa2/database';

export async function inventoryReport(storeId: string, q?: string) {
  const rows = await prisma.storeInventory.findMany({
    where: {
      storeId,
      variantId: null,
      ...(q
        ? { product: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { sku: { contains: q, mode: 'insensitive' } }] } }
        : {}),
    },
    orderBy: [{ state: 'asc' }, { quantityOnHand: 'asc' }],
    include: { product: { select: { id: true, name: true, sku: true, unitType: true } } },
    take: 200,
  });
  const lowOrOut = rows.filter((r) => r.state === 'LOW_STOCK' || r.state === 'OUT_OF_STOCK');
  return { rows, lowOrOutCount: lowOrOut.length };
}

/** Set absolute on-hand quantity, recompute state, log the adjustment. */
export async function adjustInventory(params: {
  storeId: string;
  productId: string;
  newQuantityOnHand: number;
  reason: InventoryAdjustmentReason;
  note?: string;
  staffId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const inv = await tx.storeInventory.findFirst({
      where: { storeId: params.storeId, productId: params.productId, variantId: null },
    });
    const before = inv?.quantityOnHand ?? 0;
    const delta = params.newQuantityOnHand - before;
    const state = deriveInventoryState(
      params.newQuantityOnHand,
      inv?.quantityReserved ?? 0,
      inv?.lowStockThreshold ?? 6,
      inv?.state === 'TEMPORARILY_UNAVAILABLE',
    );

    if (inv) {
      await tx.storeInventory.update({
        where: { id: inv.id },
        data: { quantityOnHand: params.newQuantityOnHand, state },
      });
    } else {
      await tx.storeInventory.create({
        data: {
          storeId: params.storeId,
          productId: params.productId,
          quantityOnHand: params.newQuantityOnHand,
          state,
        },
      });
    }

    await tx.inventoryAdjustment.create({
      data: {
        storeId: params.storeId,
        productId: params.productId,
        reason: params.reason,
        quantityDelta: delta,
        quantityAfter: params.newQuantityOnHand,
        note: params.note,
        createdById: params.staffId,
      },
    });
  });
}

export async function setInventoryHold(params: {
  storeId: string;
  productId: string;
  hold: boolean;
  staffId: string;
}) {
  const inv = await prisma.storeInventory.findFirst({
    where: { storeId: params.storeId, productId: params.productId, variantId: null },
  });
  if (!inv) return;
  const state = params.hold
    ? 'TEMPORARILY_UNAVAILABLE'
    : deriveInventoryState(inv.quantityOnHand, inv.quantityReserved, inv.lowStockThreshold);
  await prisma.storeInventory.update({ where: { id: inv.id }, data: { state } });
  await prisma.inventoryAdjustment.create({
    data: {
      storeId: params.storeId,
      productId: params.productId,
      reason: 'MANUAL',
      quantityDelta: 0,
      quantityAfter: inv.quantityOnHand,
      note: params.hold ? 'Placed on hold' : 'Hold released',
      createdById: params.staffId,
    },
  });
}
