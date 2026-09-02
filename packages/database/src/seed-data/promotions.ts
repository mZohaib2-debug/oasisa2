/** DEMO promotions & coupons. */

export interface SeedPromotion {
  slug: string;
  name: string;
  description: string;
  type: 'PERCENT_OFF' | 'AMOUNT_OFF' | 'BOGO' | 'FIXED_PRICE';
  scope: 'ORDER' | 'PRODUCT' | 'CATEGORY' | 'DEPARTMENT';
  value: number; // bps for PERCENT_OFF, cents otherwise
  minSubtotalCents?: number;
  isFeatured?: boolean;
  priority?: number;
  /** match targets by slug */
  productSlugs?: string[];
  categorySlugs?: string[];
  departmentSlugs?: string[];
  storeSlug?: string;
}

export const PROMOTIONS: SeedPromotion[] = [
  {
    slug: 'weekly-specials-spices',
    name: 'Weekly Special: 15% off Recipe Masalas',
    description: 'This week only — 15% off all recipe masala mixes.',
    type: 'PERCENT_OFF',
    scope: 'CATEGORY',
    value: 1500,
    isFeatured: true,
    priority: 10,
    categorySlugs: ['recipe-masala-mixes'],
  },
  {
    slug: 'weekly-specials-basmati',
    name: 'Weekly Special: $1 off White Basmati Rice',
    description: 'Save $1 on White Basmati Rice, all bag sizes.',
    type: 'AMOUNT_OFF',
    scope: 'PRODUCT',
    value: 100,
    isFeatured: true,
    priority: 9,
    productSlugs: ['white-basmati-rice'],
  },
  {
    slug: 'glen-burnie-produce-10',
    name: 'Glen Burnie: 10% off Produce',
    description: 'Glen Burnie branch — 10% off all fresh produce.',
    type: 'PERCENT_OFF',
    scope: 'DEPARTMENT',
    value: 1000,
    isFeatured: true,
    priority: 5,
    departmentSlugs: ['produce'],
    storeSlug: 'glen-burnie',
  },
  {
    slug: 'big-basket-5-off',
    name: '$5 off orders over $60',
    description: 'Spend $60 or more and get $5 off your order.',
    type: 'AMOUNT_OFF',
    scope: 'ORDER',
    value: 500,
    minSubtotalCents: 6000,
    priority: 1,
  },
];

export interface SeedCoupon {
  code: string;
  type: 'PERCENT_OFF' | 'AMOUNT_OFF' | 'FREE_DELIVERY';
  value: number;
  minSubtotalCents?: number;
  perCustomerLimit?: number;
}

export const COUPONS: SeedCoupon[] = [
  { code: 'WELCOME10', type: 'PERCENT_OFF', value: 1000, minSubtotalCents: 3000 },
  { code: 'FREEDELIVERY', type: 'FREE_DELIVERY', value: 0, minSubtotalCents: 5000 },
  { code: 'EID5', type: 'AMOUNT_OFF', value: 500, minSubtotalCents: 4000 },
];
