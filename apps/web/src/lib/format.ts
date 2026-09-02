export { formatCents, formatPerPound } from '@oasisa2/commerce';

export function titleCase(s: string): string {
  return s.replace(/(^|[\s-])\S/g, (c) => c.toUpperCase());
}

const HALAL_LABEL: Record<string, string> = {
  HALAL_CERTIFIED: 'Halal Certified',
  HALAL: 'Halal',
  NOT_APPLICABLE: '',
};
export function halalLabel(status: string): string {
  return HALAL_LABEL[status] ?? '';
}

const INVENTORY_LABEL: Record<string, string> = {
  IN_STOCK: 'In stock',
  LOW_STOCK: 'Low stock',
  OUT_OF_STOCK: 'Out of stock',
  TEMPORARILY_UNAVAILABLE: 'Unavailable',
};
export function inventoryLabel(state: string): string {
  return INVENTORY_LABEL[state] ?? state;
}

export function orderStatusLabel(status: string): string {
  return titleCase(status.replace(/_/g, ' ').toLowerCase());
}

/** "curry_cut" -> "Curry Cut" for butcher selection values. */
export function humanizeValue(value: string): string {
  return titleCase(value.replace(/_/g, ' '));
}

export function butcherSummary(selections: unknown): string {
  if (!selections || typeof selections !== 'object') return '';
  return Object.values(selections as Record<string, string>)
    .filter(Boolean)
    .map(humanizeValue)
    .join(', ');
}

export function to12h(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = (h ?? 0) >= 12 ? 'PM' : 'AM';
  const hr = (h ?? 0) % 12 || 12;
  return `${hr}${m ? ':' + String(m).padStart(2, '0') : ''} ${ampm}`;
}

export function formatTimeRange(start: string, end: string): string {
  return `${to12h(start)} – ${to12h(end)}`;
}

export function formatSlot(dateISO: string, start: string, end: string): string {
  const d = new Date(`${dateISO}T00:00:00`);
  const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const to12 = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = (h ?? 0) >= 12 ? 'PM' : 'AM';
    const hr = ((h ?? 0) % 12) || 12;
    return `${hr}${m ? ':' + String(m).padStart(2, '0') : ''} ${ampm}`;
  };
  return `${day}, ${to12(start)}–${to12(end)}`;
}
