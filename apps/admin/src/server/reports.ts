import 'server-only';
import { prisma, type Prisma } from '@oasisa2/database';

const REVENUE_STATUSES: Prisma.EnumOrderStatusFilter = {
  in: ['PACKED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'],
};

export async function dashboardMetrics(storeId?: string) {
  const storeWhere = storeId ? { storeId } : {};
  const since30 = new Date(Date.now() - 30 * 86_400_000);

  const [revenueAgg, orderCount, openOrders, newCustomers, deliverySplit, topProducts, lowStock] =
    await Promise.all([
      prisma.order.aggregate({
        where: { ...storeWhere, status: REVENUE_STATUSES, placedAt: { gte: since30 } },
        _sum: { finalTotalCents: true, estimatedTotalCents: true, subtotalCents: true },
        _count: true,
      }),
      prisma.order.count({ where: { ...storeWhere, placedAt: { gte: since30 } } }),
      prisma.order.count({
        where: {
          ...storeWhere,
          status: { in: ['RECEIVED', 'CONFIRMED', 'PICKING', 'BUTCHER_PREPARING', 'PREPARING', 'PACKED'] },
        },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: since30 } } }),
      prisma.order.groupBy({
        by: ['fulfillmentType'],
        where: { ...storeWhere, placedAt: { gte: since30 } },
        _count: true,
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { ...storeWhere, placedAt: { gte: since30 } } },
        _sum: { quantity: true },
        _count: true,
        orderBy: { _count: { productId: 'desc' } },
        take: 8,
      }),
      prisma.storeInventory.count({
        where: { ...(storeId ? { storeId } : {}), state: { in: ['LOW_STOCK', 'OUT_OF_STOCK'] } },
      }),
    ]);

  const revenueCents =
    (revenueAgg._sum.finalTotalCents ?? 0) || (revenueAgg._sum.estimatedTotalCents ?? 0);
  const paidOrders = revenueAgg._count || 0;
  const aovCents = paidOrders > 0 ? Math.round(revenueCents / paidOrders) : 0;

  const productIds = topProducts.map((t) => t.productId);
  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      })
    : [];
  const nameById = new Map(products.map((p) => [p.id, p.name]));

  return {
    revenueCents,
    orderCount,
    aovCents,
    openOrders,
    newCustomers,
    lowStock,
    deliverySplit: {
      pickup: deliverySplit.find((d) => d.fulfillmentType === 'PICKUP')?._count ?? 0,
      delivery: deliverySplit.find((d) => d.fulfillmentType === 'DELIVERY')?._count ?? 0,
    },
    topProducts: topProducts.map((t) => ({
      name: nameById.get(t.productId) ?? 'Unknown',
      units: t._sum.quantity ?? 0,
      orders: t._count,
    })),
  };
}

export async function revenueByDay(storeId?: string, days = 14) {
  const since = new Date(Date.now() - days * 86_400_000);
  const orders = await prisma.order.findMany({
    where: {
      ...(storeId ? { storeId } : {}),
      status: REVENUE_STATUSES,
      placedAt: { gte: since },
    },
    select: { placedAt: true, finalTotalCents: true, estimatedTotalCents: true },
  });

  const byDay = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    byDay.set(d, 0);
  }
  for (const o of orders) {
    const key = o.placedAt.toISOString().slice(0, 10);
    if (byDay.has(key)) {
      byDay.set(key, (byDay.get(key) ?? 0) + (o.finalTotalCents ?? o.estimatedTotalCents));
    }
  }
  return [...byDay.entries()].reverse().map(([date, cents]) => ({ date, cents }));
}
