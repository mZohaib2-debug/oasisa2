import { z } from 'zod';

/** Shared request validation. Server code parses untrusted input through these
 *  BEFORE it reaches business logic. Notably: no price / discount / total field
 *  is ever accepted from a client. */

export const fulfillmentTypeSchema = z.enum(['PICKUP', 'DELIVERY']);
export const substitutionSchema = z.enum([
  'BEST_SUBSTITUTE',
  'CONTACT_ME',
  'DO_NOT_SUBSTITUTE',
]);

export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}(-\d{4})?$/, 'Enter a 5-digit ZIP code');

export const storeContextSchema = z.object({
  storeSlug: z.string().min(1),
  fulfillmentType: fulfillmentTypeSchema,
  deliveryPostalCode: postalCodeSchema.optional(),
});
export type StoreContextInput = z.infer<typeof storeContextSchema>;

export const butcherSelectionsSchema = z
  .object({
    cut: z.string().optional(),
    pieceSize: z.string().optional(),
    bone: z.string().optional(),
    thickness: z.string().optional(),
    skin: z.string().optional(),
    fat: z.string().optional(),
  })
  .strict();

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  quantity: z.number().int().min(1).max(99).optional(),
  requestedWeightLb: z.number().positive().max(100).optional(),
  butcherSelections: butcherSelectionsSchema.optional(),
  butcherNotes: z.string().max(500).optional(),
  substitution: substitutionSchema.optional(),
});
export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartItemSchema = z.object({
  cartItemId: z.string().min(1),
  quantity: z.number().int().min(0).max(99).optional(),
  requestedWeightLb: z.number().positive().max(100).optional(),
  butcherSelections: butcherSelectionsSchema.optional(),
  butcherNotes: z.string().max(500).optional(),
  substitution: substitutionSchema.optional(),
  savedForLater: z.boolean().optional(),
});

export const applyCouponSchema = z.object({ code: z.string().trim().min(1).max(40) });

export const addressSchema = z.object({
  recipientName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(7).max(20),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().length(2),
  postalCode: postalCodeSchema,
  gateCode: z.string().trim().max(40).optional(),
  deliveryInstructions: z.string().trim().max(500).optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const checkoutSchema = z.object({
  contactName: z.string().trim().min(1).max(120),
  contactEmail: z.string().trim().email().optional(),
  contactPhone: z.string().trim().min(7).max(20),
  fulfillmentType: fulfillmentTypeSchema,
  slotId: z.string().min(1),
  address: addressSchema.optional(),
  deliveryInstructions: z.string().trim().max(500).optional(),
  contactless: z.boolean().optional(),
  leaveAtDoor: z.boolean().optional(),
  tipCents: z.number().int().min(0).max(50000).optional(),
  couponCode: z.string().trim().max(40).optional(),
  customerNote: z.string().trim().max(500).optional(),
  createAccount: z.boolean().optional(),
  password: z.string().min(8).max(200).optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const productFilterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  department: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  halalOnly: z.coerce.boolean().optional(),
  inStockOnly: z.coerce.boolean().optional(),
  onSaleOnly: z.coerce.boolean().optional(),
  minPriceCents: z.coerce.number().int().min(0).optional(),
  maxPriceCents: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['recommended', 'popular', 'price_asc', 'price_desc', 'newest']).default('recommended'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});
export type ProductFilterInput = z.infer<typeof productFilterSchema>;

export const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});

export const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
});

export const orderStatusUpdateSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum([
    'RECEIVED',
    'CONFIRMED',
    'PICKING',
    'BUTCHER_PREPARING',
    'PREPARING',
    'PACKED',
    'READY_FOR_PICKUP',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
  ]),
  note: z.string().trim().max(500).optional(),
});
