import 'server-only';
import { generateSlots } from '@oasisa2/commerce';
import { SLOT_CONFIG } from '@oasisa2/config';
import { prisma, type FulfillmentType } from '@oasisa2/database';

export async function getStoreAdmin(slug: string) {
  return prisma.store.findUnique({
    where: { slug },
    include: {
      hours: { orderBy: { dayOfWeek: 'asc' } },
      deliveryZones: { orderBy: { name: 'asc' } },
      notices: { orderBy: { createdAt: 'desc' } },
      _count: { select: { orders: true, fulfillmentSlots: true } },
    },
  });
}

export async function listStoresAdmin() {
  return prisma.store.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { deliveryZones: true, orders: true } } },
  });
}

/** (Re)generate fulfilment slots for the next horizon from current store hours. */
export async function regenerateSlots(storeId: string) {
  const store = await prisma.store.findUniqueOrThrow({
    where: { id: storeId },
    include: { hours: true },
  });
  const hoursByWeekday: Record<number, { opensAt: string | null; closesAt: string | null }> = {};
  for (const h of store.hours) {
    hoursByWeekday[h.dayOfWeek] = { opensAt: h.isClosed ? null : h.opensAt, closesAt: h.closesAt };
  }

  let created = 0;
  for (const type of ['PICKUP', 'DELIVERY'] as FulfillmentType[]) {
    const slots = generateSlots(type, {
      fromDate: new Date(),
      horizonDays: SLOT_CONFIG.horizonDays,
      slotMinutes: SLOT_CONFIG.slotMinutes,
      dayStart: SLOT_CONFIG.dayStart,
      dayEnd: SLOT_CONFIG.dayEnd,
      capacity: SLOT_CONFIG.defaultCapacity,
      prepMinutes: type === 'PICKUP' ? store.pickupPrepMinutes : store.deliveryPrepMinutes,
      hoursByWeekday,
    });
    for (const s of slots) {
      const res = await prisma.fulfillmentSlot.upsert({
        where: {
          storeId_type_date_startTime: {
            storeId,
            type,
            date: new Date(s.date),
            startTime: s.startTime,
          },
        },
        update: { endTime: s.endTime },
        create: {
          storeId,
          type,
          date: new Date(s.date),
          startTime: s.startTime,
          endTime: s.endTime,
          capacity: s.capacity,
        },
      });
      if (res) created++;
    }
  }
  return created;
}

export async function upcomingSlots(storeId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return prisma.fulfillmentSlot.findMany({
    where: { storeId, date: { gte: today } },
    orderBy: [{ date: 'asc' }, { type: 'asc' }, { startTime: 'asc' }],
    take: 120,
  });
}
