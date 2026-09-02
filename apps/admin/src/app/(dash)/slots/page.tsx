import { requireRole } from '@/lib/auth';
import { getStoreScope } from '@/lib/store-scope';
import { upcomingSlots } from '@/server/stores';
import { SlotToggle } from '@/components/slot-toggle';
import { RegenerateSlotsButton } from '@/components/regenerate-slots-button';
import { to12h } from '@/lib/format';

export default async function SlotsPage() {
  await requireRole(['STORE_MANAGER']);
  const scope = await getStoreScope();
  const slots = await upcomingSlots(scope.storeId);

  const byDate = new Map<string, typeof slots>();
  for (const s of slots) {
    const key = s.date.toISOString().slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(s);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-900">Time slots — {scope.shortName}</h1>
        <RegenerateSlotsButton storeId={scope.storeId} />
      </div>
      <p className="text-sm text-ink-500">
        {slots.length} upcoming slots. Toggle a slot off to stop taking bookings for it.
      </p>

      <div className="space-y-4">
        {[...byDate.entries()].map(([date, daySlots]) => (
          <div key={date} className="card p-4">
            <p className="mb-2 font-semibold text-ink-900">
              {new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {daySlots.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded border border-ink-200 px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium">{s.type === 'PICKUP' ? 'Pickup' : 'Delivery'}</span>{' '}
                    {to12h(s.startTime)}–{to12h(s.endTime)}
                    <span className="ml-1 text-ink-400">
                      {s.reservedCount}/{s.capacity}
                    </span>
                  </span>
                  <SlotToggle slotId={s.id} isActive={s.isActive} />
                </div>
              ))}
            </div>
          </div>
        ))}
        {slots.length === 0 && (
          <p className="text-sm text-ink-500">
            No slots. Use “Regenerate time slots” above (make sure store hours are set).
          </p>
        )}
      </div>
    </div>
  );
}
