import 'server-only';
import { prisma, type Prisma, type OrderStatus, type FulfillmentType } from '@oasisa2/database';

export interface OrderListFilter {
  storeId?: string;
  status?: OrderStatus;
  fulfillmentType?: FulfillmentType;
  q?: string;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}

export async function listOrders(filter: OrderListFilter) {
  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? 25;
  const where: Prisma.OrderWhereInput = {};
  if (filter.storeId) where.storeId = filter.storeId;
  if (filter.status) where.status = filter.status;
  if (filter.fulfillmentType) where.fulfillmentType = filter.fulfillmentType;
  if (filter.from || filter.to) {
    where.placedAt = {};
    if (filter.from) where.placedAt.gte = filter.from;
    if (filter.to) where.placedAt.lte = filter.to;
  }
  if (filter.q) {
    where.OR = [
      { orderNumber: { contains: filter.q, mode: 'insensitive' } },
      { contactName: { contains: filter.q, mode: 'insensitive' } },
      { contactPhone: { contains: filter.q } },
      { contactEmail: { contains: filter.q, mode: 'insensitive' } },
    ];
  }

  const [total, orders, statusCounts] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { placedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        store: { select: { shortName: true } },
        slot: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.groupBy({
      by: ['status'],
      where: filter.storeId ? { storeId: filter.storeId } : {},
      _count: true,
    }),
  ]);

  return {
    orders,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])) as Record<
      string,
      number
    >,
  };
}

export async function getOrderDetail(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      store: true,
      slot: true,
      address: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      payments: true,
      refunds: true,
      statusHistory: {
        orderBy: { createdAt: 'asc' },
        include: { changedBy: { select: { firstName: true, lastName: true } } },
      },
      items: {
        include: {
          product: { select: { slug: true, unitType: true, department: { select: { name: true } } } },
          variant: { select: { name: true } },
          butcherInstruction: true,
          pickedBy: { select: { firstName: true } },
          butcheredBy: { select: { firstName: true } },
        },
      },
    },
  });
}

/** Queue for pickers: confirmed orders not yet packed, oldest first. */
export async function pickingQueue(storeId: string) {
  return prisma.order.findMany({
    where: {
      storeId,
      status: { in: ['CONFIRMED', 'PICKING', 'BUTCHER_PREPARING', 'PREPARING'] },
    },
    orderBy: { placedAt: 'asc' },
    include: {
      slot: true,
      _count: { select: { items: true } },
      items: { select: { status: true, unitType: true } },
    },
  });
}

/** Queue for butchers: order items that need cutting and aren't done. */
export async function butcherQueue(storeId: string) {
  const items = await prisma.orderItem.findMany({
    where: {
      order: { storeId, status: { notIn: ['COMPLETED', 'CANCELLED', 'DELIVERED'] } },
      unitType: 'WEIGHT',
      status: { in: ['PENDING', 'SENT_TO_BUTCHER'] },
      OR: [{ butcherInstruction: { isNot: null } }, { product: { butcherOptions: { some: {} } } }],
    },
    orderBy: { createdAt: 'asc' },
    include: {
      butcherInstruction: true,
      order: { select: { orderNumber: true, placedAt: true, slot: true, fulfillmentType: true } },
      product: { select: { name: true } },
    },
  });
  return items;
}

export async function pickingCounts(storeId: string) {
  const [picking, butcher] = await Promise.all([
    prisma.order.count({
      where: { storeId, status: { in: ['CONFIRMED', 'PICKING', 'PREPARING', 'BUTCHER_PREPARING'] } },
    }),
    prisma.orderItem.count({
      where: {
        order: { storeId, status: { notIn: ['COMPLETED', 'CANCELLED', 'DELIVERED'] } },
        unitType: 'WEIGHT',
        status: { in: ['PENDING', 'SENT_TO_BUTCHER'] },
      },
    }),
  ]);
  return { picking, butcher };
}
