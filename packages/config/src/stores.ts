/**
 * Branch configuration PLACEHOLDERS.
 *
 * These values are intentionally "TBD". Real addresses, phone numbers, hours,
 * delivery ZIPs, fees and minimums must be entered by OasisA2 staff in the
 * admin dashboard (they live on the `Store` / `DeliveryZone` / `StoreHours`
 * tables). Nothing here is a real-world claim.
 *
 * The seed script uses these to create the two Store rows on first run.
 */

export interface StorePlaceholder {
  slug: string;
  name: string;
  shortName: string;
  state: string;
  /** null => unknown / to be filled in by staff */
  phone: string | null;
  line1: string;
  city: string;
  postalCode: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  /** Illustrative default economics — override per branch/zone in admin. */
  deliveryFeeCents: number;
  deliveryMinimumCents: number;
  freeDeliveryThresholdCents: number | null;
  pickupPrepMinutes: number;
  deliveryPrepMinutes: number;
  /** Placeholder ZIP list so delivery eligibility is testable before real data. */
  placeholderDeliveryPostalCodes: string[];
  /** Placeholder weekly hours; "TBD" until staff confirm. */
  placeholderHours: Array<{ dayOfWeek: number; opensAt: string | null; closesAt: string | null }>;
}

const STANDARD_HOURS = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
  dayOfWeek,
  opensAt: '09:00',
  closesAt: '21:00',
}));

export const STORE_PLACEHOLDERS: StorePlaceholder[] = [
  {
    slug: 'glen-burnie',
    name: 'Glen Burnie Branch',
    shortName: 'Glen Burnie',
    state: 'MD',
    phone: null,
    line1: 'TBD — enter store address in admin',
    city: 'Glen Burnie',
    postalCode: 'TBD',
    pickupEnabled: true,
    deliveryEnabled: true,
    deliveryFeeCents: 599,
    deliveryMinimumCents: 3500,
    freeDeliveryThresholdCents: 7500,
    pickupPrepMinutes: 120,
    deliveryPrepMinutes: 180,
    placeholderDeliveryPostalCodes: ['21060', '21061', '21225', '21226', '21122'],
    placeholderHours: STANDARD_HOURS,
  },
  {
    slug: 'fredericksburg',
    name: 'Fredericksburg Branch',
    shortName: 'Fredericksburg',
    state: 'VA',
    phone: null,
    line1: 'TBD — enter store address in admin',
    city: 'Fredericksburg',
    postalCode: 'TBD',
    pickupEnabled: true,
    deliveryEnabled: true,
    deliveryFeeCents: 699,
    deliveryMinimumCents: 4000,
    freeDeliveryThresholdCents: 8500,
    pickupPrepMinutes: 120,
    deliveryPrepMinutes: 210,
    placeholderDeliveryPostalCodes: ['22401', '22405', '22406', '22407', '22408'],
    placeholderHours: STANDARD_HOURS,
  },
];

export const DEFAULT_STORE_SLUG = 'glen-burnie';
