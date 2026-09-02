import { prisma } from '@oasisa2/database';
import { toSlotView } from '@oasisa2/commerce';
import type { FulfillmentType } from '@oasisa2/types';

/** Upcoming bookable slots for a store + fulfillment type, grouped by date. */
export async function getAvailableSlots(storeId: string, type: FulfillmentType) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slots = await prisma.fulfillmentSlot.findMany({
    where: { storeId, type, isActive: true, date: { gte: today } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  const byDate = new Map<
    string,
    { date: string; slots: { id: string; startTime: string; endTime: string; available: boolean; remaining: number }[] }
  >();

  for (const s of slots) {
    const dateKey = s.date.toISOString().slice(0, 10);
    const view = toSlotView({
      id: s.id,
      type: s.type,
      date: dateKey,
      startTime: s.startTime,
      endTime: s.endTime,
      capacity: s.capacity,
      reservedCount: s.reservedCount,
      isActive: s.isActive,
    });
    if (!byDate.has(dateKey)) byDate.set(dateKey, { date: dateKey, slots: [] });
    byDate.get(dateKey)!.slots.push({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      available: view.available,
      remaining: view.remaining,
    });
  }

  return [...byDate.values()].slice(0, 7);
}
