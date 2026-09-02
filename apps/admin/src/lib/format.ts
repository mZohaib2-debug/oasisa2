export function formatCents(cents: number | null | undefined): string {
  if (cents == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function centsToInput(cents: number | null | undefined): string {
  return cents == null ? '' : (cents / 100).toFixed(2);
}

export function inputToCents(value: FormDataEntryValue | null): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export function titleCase(s: string): string {
  return s.replace(/(^|[\s_-])\S/g, (c) => c.toUpperCase()).replace(/[_-]/g, ' ');
}

export function statusLabel(s: string): string {
  return titleCase(s.toLowerCase());
}

export function humanizeValue(v: string): string {
  return titleCase(v.replace(/_/g, ' '));
}

export function butcherSummary(selections: unknown): string {
  if (!selections || typeof selections !== 'object') return '';
  return Object.values(selections as Record<string, string>)
    .filter(Boolean)
    .map(humanizeValue)
    .join(', ');
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function to12h(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = (h ?? 0) >= 12 ? 'PM' : 'AM';
  const hr = (h ?? 0) % 12 || 12;
  return `${hr}${m ? ':' + String(m).padStart(2, '0') : ''} ${ampm}`;
}
export function slotLabel(date: Date | string, start: string, end: string): string {
  const d = new Date(date);
  return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${to12h(start)}–${to12h(end)}`;
}

const ORDER_STATUS_TONE: Record<string, string> = {
  RECEIVED: 'bg-ink-100 text-ink-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PICKING: 'bg-amber-100 text-amber-800',
  BUTCHER_PREPARING: 'bg-rose-100 text-rose-800',
  PREPARING: 'bg-amber-100 text-amber-800',
  PACKED: 'bg-violet-100 text-violet-800',
  READY_FOR_PICKUP: 'bg-forest-100 text-forest-800',
  OUT_FOR_DELIVERY: 'bg-forest-100 text-forest-800',
  DELIVERED: 'bg-forest-100 text-forest-800',
  COMPLETED: 'bg-forest-200 text-forest-900',
  CANCELLED: 'bg-red-100 text-red-700',
};
export function orderStatusTone(s: string): string {
  return ORDER_STATUS_TONE[s] ?? 'bg-ink-100 text-ink-700';
}

const INV_TONE: Record<string, string> = {
  IN_STOCK: 'bg-forest-100 text-forest-800',
  LOW_STOCK: 'bg-amber-100 text-amber-800',
  OUT_OF_STOCK: 'bg-red-100 text-red-700',
  TEMPORARILY_UNAVAILABLE: 'bg-ink-200 text-ink-700',
};
export function inventoryTone(s: string): string {
  return INV_TONE[s] ?? 'bg-ink-100 text-ink-700';
}
