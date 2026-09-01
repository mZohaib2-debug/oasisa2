import { FulfillmentType } from '@oasisa2/types';

/** Fulfillment slot availability & generation. Overbooking is prevented by
 *  checking `reservedCount < capacity` and by a unique DB constraint on
 *  (store, type, date, startTime). */

export interface SlotRow {
  id: string;
  type: FulfillmentType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm local
  endTime: string;
  capacity: number;
  reservedCount: number;
  isActive: boolean;
}

export interface SlotView extends SlotRow {
  available: boolean;
  remaining: number;
}

export function toSlotView(slot: SlotRow): SlotView {
  const remaining = Math.max(0, slot.capacity - slot.reservedCount);
  return { ...slot, remaining, available: slot.isActive && remaining > 0 };
}

export function canReserve(slot: SlotRow): boolean {
  return slot.isActive && slot.reservedCount < slot.capacity;
}

export interface GenerateSlotsOptions {
  fromDate: Date;
  horizonDays: number;
  slotMinutes: number;
  dayStart: string; // "10:00"
  dayEnd: string; // "20:00"
  capacity: number;
  prepMinutes: number;
  /** Local store hours by weekday: null => closed. */
  hoursByWeekday: Record<number, { opensAt: string | null; closesAt: string | null }>;
}

function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
function minutesToHm(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface GeneratedSlot {
  type: FulfillmentType;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
}

/** Pure generator — the ingest/cron job persists these with upserts. */
export function generateSlots(
  type: FulfillmentType,
  opts: GenerateSlotsOptions,
): GeneratedSlot[] {
  const out: GeneratedSlot[] = [];
  const now = opts.fromDate;
  const earliestReady = new Date(now.getTime() + opts.prepMinutes * 60_000);

  for (let d = 0; d < opts.horizonDays; d++) {
    const day = new Date(now);
    day.setDate(day.getDate() + d);
    const weekday = day.getDay();
    const hours = opts.hoursByWeekday[weekday];
    if (!hours || !hours.opensAt || !hours.closesAt) continue;

    const dateStr = day.toISOString().slice(0, 10);
    const windowStart = Math.max(hmToMinutes(opts.dayStart), hmToMinutes(hours.opensAt));
    const windowEnd = Math.min(hmToMinutes(opts.dayEnd), hmToMinutes(hours.closesAt));

    for (let t = windowStart; t + opts.slotMinutes <= windowEnd; t += opts.slotMinutes) {
      const slotStart = new Date(day);
      slotStart.setHours(Math.floor(t / 60), t % 60, 0, 0);
      if (slotStart < earliestReady) continue;
      out.push({
        type,
        date: dateStr,
        startTime: minutesToHm(t),
        endTime: minutesToHm(t + opts.slotMinutes),
        capacity: opts.capacity,
      });
    }
  }
  return out;
}
