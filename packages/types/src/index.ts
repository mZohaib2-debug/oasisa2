/**
 * Shared domain enums & DTOs used across web, mobile, admin and the API layer.
 * Enum string values MUST match the Prisma schema exactly.
 */

export const FulfillmentType = {
  PICKUP: 'PICKUP',
  DELIVERY: 'DELIVERY',
} as const;
export type FulfillmentType = (typeof FulfillmentType)[keyof typeof FulfillmentType];

export const UnitType = {
  EACH: 'EACH',
  WEIGHT: 'WEIGHT',
} as const;
export type UnitType = (typeof UnitType)[keyof typeof UnitType];

export const HalalStatus = {
  HALAL_CERTIFIED: 'HALAL_CERTIFIED',
  HALAL: 'HALAL',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
} as const;
export type HalalStatus = (typeof HalalStatus)[keyof typeof HalalStatus];

export const InventoryState = {
  IN_STOCK: 'IN_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  TEMPORARILY_UNAVAILABLE: 'TEMPORARILY_UNAVAILABLE',
} as const;
export type InventoryState = (typeof InventoryState)[keyof typeof InventoryState];

export const SubstitutionPreference = {
  BEST_SUBSTITUTE: 'BEST_SUBSTITUTE',
  CONTACT_ME: 'CONTACT_ME',
  DO_NOT_SUBSTITUTE: 'DO_NOT_SUBSTITUTE',
} as const;
export type SubstitutionPreference =
  (typeof SubstitutionPreference)[keyof typeof SubstitutionPreference];

export const OrderStatus = {
  RECEIVED: 'RECEIVED',
  CONFIRMED: 'CONFIRMED',
  PICKING: 'PICKING',
  BUTCHER_PREPARING: 'BUTCHER_PREPARING',
  PREPARING: 'PREPARING',
  PACKED: 'PACKED',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

/** Valid forward transitions for the order lifecycle. */
export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  RECEIVED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PICKING', 'CANCELLED'],
  PICKING: ['BUTCHER_PREPARING', 'PREPARING', 'PACKED', 'CANCELLED'],
  BUTCHER_PREPARING: ['PREPARING', 'PACKED', 'CANCELLED'],
  PREPARING: ['PACKED', 'CANCELLED'],
  PACKED: ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  READY_FOR_PICKUP: ['COMPLETED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const BUTCHER_GROUPS = ['cut', 'pieceSize', 'bone', 'thickness', 'skin', 'fat'] as const;
export type ButcherGroup = (typeof BUTCHER_GROUPS)[number];
export type ButcherSelections = Partial<Record<ButcherGroup, string>>;

export const ANALYTICS_EVENTS = [
  'store_selected',
  'fulfillment_selected',
  'search_performed',
  'product_viewed',
  'category_viewed',
  'add_to_cart',
  'remove_from_cart',
  'favorite_added',
  'list_created',
  'checkout_started',
  'checkout_completed',
  'order_placed',
  'reorder',
  'coupon_applied',
  'substitution_selected',
  'delivery_selected',
  'pickup_selected',
] as const;
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export interface Money {
  cents: number;
  currency: 'usd';
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}
