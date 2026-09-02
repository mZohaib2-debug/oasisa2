'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { recordActualWeight } from '@oasisa2/api';
import {
  prisma,
  type InventoryAdjustmentReason,
  type OrderItemStatus,
  type OrderStatus,
  type PromotionScope,
  type PromotionType,
  type UserRole,
} from '@oasisa2/database';
import { credentialsSchema } from '@oasisa2/validation';
import { requireStaff, requireRole, setStaffSession, clearStaffSession } from '@/lib/auth';
import { setStoreScope } from '@/lib/store-scope';
import { inputToCents } from '@/lib/format';
import { writeAudit } from '@/server/audit';
import { setItemStatus, transitionOrder } from '@/server/fulfillment';
import { adjustInventory, setInventoryHold } from '@/server/inventory';
import { regenerateSlots } from '@/server/stores';

export type Result = { ok: true; data?: unknown } | { ok: false; error: string };

const STAFF_ROLES: UserRole[] = ['ADMIN', 'STORE_MANAGER', 'PICKER', 'BUTCHER'];

// ---------------------------------------------------------------- auth --------
export async function loginAction(formData: FormData): Promise<Result> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { ok: false, error: 'Enter your email and password.' };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (
    !user?.passwordHash ||
    !user.isActive ||
    !STAFF_ROLES.includes(user.role) ||
    !(await bcrypt.compare(parsed.data.password, user.passwordHash))
  ) {
    return { ok: false, error: 'Invalid staff credentials.' };
  }
  await setStaffSession(user.id);
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await clearStaffSession();
  redirect('/login');
}

export async function setStoreScopeAction(slug: string): Promise<Result> {
  await requireStaff();
  await setStoreScope(slug);
  revalidatePath('/', 'layout');
  return { ok: true };
}

// -------------------------------------------------------------- orders --------
export async function transitionOrderAction(
  orderId: string,
  to: OrderStatus,
  note?: string,
): Promise<Result> {
  const staff = await requireStaff();
  try {
    await transitionOrder({ orderId, to, staffId: staff.id, note });
    await writeAudit({
      actorId: staff.id,
      action: 'STATUS_CHANGE',
      entityType: 'Order',
      entityId: orderId,
      after: { status: to },
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Transition failed.' };
  }
  revalidatePath('/orders');
  revalidatePath('/picking');
  return { ok: true };
}

export async function setItemStatusAction(
  orderItemId: string,
  status: OrderItemStatus,
  extra?: { substitutedWithProductId?: string; substitutionNote?: string },
): Promise<Result> {
  const staff = await requireStaff();
  try {
    await setItemStatus({
      orderItemId,
      status,
      staffId: staff.id,
      substitutedWithProductId: extra?.substitutedWithProductId ?? null,
      substitutionNote: extra?.substitutionNote ?? null,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Update failed.' };
  }
  revalidatePath('/picking');
  revalidatePath('/orders');
  return { ok: true };
}

export async function recordWeightAction(
  orderItemId: string,
  actualWeightLb: number,
): Promise<Result> {
  const staff = await requireRole(['BUTCHER']);
  if (!(actualWeightLb > 0)) return { ok: false, error: 'Enter a weight greater than 0.' };
  try {
    const result = await recordActualWeight(orderItemId, actualWeightLb, staff.id);
    await prisma.orderItem.update({ where: { id: orderItemId }, data: { status: 'BUTCHER_DONE' } });
    revalidatePath('/butcher');
    revalidatePath('/picking');
    revalidatePath('/orders');
    return { ok: true, data: result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not record weight.' };
  }
}

// ----------------------------------------------------------- inventory --------
export async function adjustInventoryAction(formData: FormData): Promise<Result> {
  const staff = await requireRole(['STORE_MANAGER']);
  const storeId = String(formData.get('storeId'));
  const productId = String(formData.get('productId'));
  const newQuantityOnHand = Number(formData.get('quantity'));
  const reason = String(formData.get('reason') || 'RECOUNT') as InventoryAdjustmentReason;
  if (!Number.isFinite(newQuantityOnHand) || newQuantityOnHand < 0) {
    return { ok: false, error: 'Enter a valid quantity.' };
  }
  await adjustInventory({
    storeId,
    productId,
    newQuantityOnHand,
    reason,
    note: String(formData.get('note') || '') || undefined,
    staffId: staff.id,
  });
  await writeAudit({
    actorId: staff.id,
    action: 'INVENTORY_CHANGE',
    entityType: 'StoreInventory',
    entityId: `${storeId}:${productId}`,
    after: { quantityOnHand: newQuantityOnHand, reason },
  });
  revalidatePath('/inventory');
  revalidatePath(`/products/${productId}`);
  return { ok: true };
}

export async function toggleHoldAction(
  storeId: string,
  productId: string,
  hold: boolean,
): Promise<Result> {
  const staff = await requireRole(['STORE_MANAGER']);
  await setInventoryHold({ storeId, productId, hold, staffId: staff.id });
  revalidatePath('/inventory');
  revalidatePath(`/products/${productId}`);
  return { ok: true };
}

// ------------------------------------------------------------- catalog --------
export async function updateProductAction(productId: string, formData: FormData): Promise<Result> {
  const staff = await requireRole(['STORE_MANAGER']);
  const before = await prisma.product.findUnique({ where: { id: productId } });
  if (!before) return { ok: false, error: 'Product not found.' };

  const isWeight = before.unitType === 'WEIGHT';
  const priceField = inputToCents(formData.get(isWeight ? 'pricePerPoundCents' : 'basePriceCents'));

  const data = {
    name: String(formData.get('name') || before.name),
    shortDescription: String(formData.get('shortDescription') || '') || null,
    description: String(formData.get('description') || '') || null,
    packageSize: String(formData.get('packageSize') || '') || null,
    countryOfOrigin: String(formData.get('countryOfOrigin') || '') || null,
    storageInstructions: String(formData.get('storageInstructions') || '') || null,
    halalStatus: String(formData.get('halalStatus') || before.halalStatus) as never,
    taxStatus: String(formData.get('taxStatus') || before.taxStatus) as never,
    isActive: formData.get('isActive') === 'on',
    isFeatured: formData.get('isFeatured') === 'on',
    isNewArrival: formData.get('isNewArrival') === 'on',
    ...(priceField != null
      ? isWeight
        ? { pricePerPoundCents: priceField, basePriceCents: priceField }
        : { basePriceCents: priceField }
      : {}),
    compareAtPriceCents: inputToCents(formData.get('compareAtPriceCents')),
  };

  const after = await prisma.product.update({ where: { id: productId }, data });
  await writeAudit({
    actorId: staff.id,
    action: 'UPDATE',
    entityType: 'Product',
    entityId: productId,
    before: { name: before.name, basePriceCents: before.basePriceCents, isActive: before.isActive },
    after: { name: after.name, basePriceCents: after.basePriceCents, isActive: after.isActive },
  });
  revalidatePath('/products');
  revalidatePath(`/products/${productId}`);
  return { ok: true };
}

export async function setStorePriceAction(formData: FormData): Promise<Result> {
  const staff = await requireRole(['STORE_MANAGER']);
  const storeId = String(formData.get('storeId'));
  const productId = String(formData.get('productId'));
  const priceCents = inputToCents(formData.get('priceCents'));
  const salePriceCents = inputToCents(formData.get('salePriceCents'));
  if (priceCents == null || priceCents < 0) return { ok: false, error: 'Enter a base price.' };

  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  const saleActive = salePriceCents != null && salePriceCents < priceCents;

  await prisma.storePrice.upsert({
    where: { storeId_productId: { storeId, productId } },
    update: {
      priceCents,
      salePriceCents: saleActive ? salePriceCents : null,
      pricePerPoundCents: product.unitType === 'WEIGHT' ? priceCents : null,
      saleStartsAt: saleActive ? new Date() : null,
      saleEndsAt: saleActive ? new Date(Date.now() + 7 * 86_400_000) : null,
    },
    create: {
      storeId,
      productId,
      priceCents,
      salePriceCents: saleActive ? salePriceCents : null,
      pricePerPoundCents: product.unitType === 'WEIGHT' ? priceCents : null,
      saleStartsAt: saleActive ? new Date() : null,
      saleEndsAt: saleActive ? new Date(Date.now() + 7 * 86_400_000) : null,
    },
  });
  await writeAudit({
    actorId: staff.id,
    action: 'PRICE_CHANGE',
    entityType: 'StorePrice',
    entityId: `${storeId}:${productId}`,
    after: { priceCents, salePriceCents: saleActive ? salePriceCents : null },
  });
  revalidatePath(`/products/${productId}`);
  revalidatePath('/products');
  return { ok: true };
}

export async function createProductAction(formData: FormData): Promise<Result> {
  const staff = await requireRole(['STORE_MANAGER']);
  const name = String(formData.get('name') || '').trim();
  const sku = String(formData.get('sku') || '').trim().toUpperCase();
  const categoryId = String(formData.get('categoryId') || '');
  const unitType = String(formData.get('unitType') || 'EACH') as 'EACH' | 'WEIGHT';
  const priceCents = inputToCents(formData.get('priceCents'));
  if (!name || !sku || !categoryId || priceCents == null) {
    return { ok: false, error: 'Name, SKU, category and price are required.' };
  }
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return { ok: false, error: 'Category not found.' };
  const exists = await prisma.product.findUnique({ where: { sku } });
  if (exists) return { ok: false, error: 'A product with that SKU already exists.' };

  const slug =
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + sku.toLowerCase();

  const stores = await prisma.store.findMany();
  const product = await prisma.product.create({
    data: {
      sku,
      slug,
      name,
      shortDescription: String(formData.get('shortDescription') || '') || null,
      departmentId: category.departmentId,
      categoryId,
      unitType,
      packageSize: String(formData.get('packageSize') || '') || null,
      basePriceCents: priceCents,
      pricePerPoundCents: unitType === 'WEIGHT' ? priceCents : null,
      halalStatus: String(formData.get('halalStatus') || 'NOT_APPLICABLE') as never,
      taxStatus: String(formData.get('taxStatus') || 'EXEMPT') as never,
      isActive: true,
      isDemo: false,
      images: { create: { url: `/images/products/${slug}.svg`, alt: name, isPrimary: true } },
      prices: {
        create: stores.map((s) => ({
          storeId: s.id,
          priceCents,
          pricePerPoundCents: unitType === 'WEIGHT' ? priceCents : null,
        })),
      },
      inventory: {
        create: stores.map((s) => ({ storeId: s.id, quantityOnHand: 0, state: 'OUT_OF_STOCK' as const })),
      },
    },
  });
  await writeAudit({
    actorId: staff.id,
    action: 'CREATE',
    entityType: 'Product',
    entityId: product.id,
    after: { name, sku },
  });
  revalidatePath('/products');
  redirect(`/products/${product.id}`);
}

export async function createBrandAction(formData: FormData): Promise<Result> {
  await requireRole(['STORE_MANAGER']);
  const name = String(formData.get('name') || '').trim();
  if (!name) return { ok: false, error: 'Brand name is required.' };
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  await prisma.brand.upsert({
    where: { slug },
    update: { name },
    create: { slug, name, isDemo: false },
  });
  revalidatePath('/brands');
  return { ok: true };
}

// -------------------------------------------------------------- stores --------
export async function updateStoreAction(slug: string, formData: FormData): Promise<Result> {
  const staff = await requireRole(['STORE_MANAGER']);
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) return { ok: false, error: 'Store not found.' };

  await prisma.store.update({
    where: { slug },
    data: {
      phone: String(formData.get('phone') || '') || null,
      email: String(formData.get('email') || '') || null,
      line1: String(formData.get('line1') || store.line1),
      line2: String(formData.get('line2') || '') || null,
      city: String(formData.get('city') || store.city),
      state: String(formData.get('state') || store.state).toUpperCase().slice(0, 2),
      postalCode: String(formData.get('postalCode') || store.postalCode),
      pickupEnabled: formData.get('pickupEnabled') === 'on',
      deliveryEnabled: formData.get('deliveryEnabled') === 'on',
      pickupPrepMinutes: Number(formData.get('pickupPrepMinutes')) || store.pickupPrepMinutes,
      deliveryPrepMinutes: Number(formData.get('deliveryPrepMinutes')) || store.deliveryPrepMinutes,
      deliveryFeeCents: inputToCents(formData.get('deliveryFeeCents')) ?? store.deliveryFeeCents,
      deliveryMinimumCents:
        inputToCents(formData.get('deliveryMinimumCents')) ?? store.deliveryMinimumCents,
      freeDeliveryThresholdCents: inputToCents(formData.get('freeDeliveryThresholdCents')),
    },
  });
  await writeAudit({
    actorId: staff.id,
    action: 'UPDATE',
    entityType: 'Store',
    entityId: store.id,
    after: { updated: 'store settings' },
  });
  revalidatePath(`/stores/${slug}`);
  revalidatePath('/stores');
  return { ok: true };
}

export async function updateHoursAction(slug: string, formData: FormData): Promise<Result> {
  await requireRole(['STORE_MANAGER']);
  const store = await prisma.store.findUniqueOrThrow({ where: { slug } });
  for (let day = 0; day < 7; day++) {
    const closed = formData.get(`closed-${day}`) === 'on';
    const opensAt = String(formData.get(`opensAt-${day}`) || '');
    const closesAt = String(formData.get(`closesAt-${day}`) || '');
    await prisma.storeHours.upsert({
      where: { storeId_dayOfWeek: { storeId: store.id, dayOfWeek: day } },
      update: {
        isClosed: closed,
        opensAt: closed ? null : opensAt || null,
        closesAt: closed ? null : closesAt || null,
      },
      create: {
        storeId: store.id,
        dayOfWeek: day,
        isClosed: closed,
        opensAt: closed ? null : opensAt || null,
        closesAt: closed ? null : closesAt || null,
      },
    });
  }
  revalidatePath(`/stores/${slug}`);
  return { ok: true };
}

export async function upsertZoneAction(slug: string, formData: FormData): Promise<Result> {
  await requireRole(['STORE_MANAGER']);
  const store = await prisma.store.findUniqueOrThrow({ where: { slug } });
  const id = String(formData.get('id') || '');
  const data = {
    name: String(formData.get('name') || 'Zone'),
    postalCodes: String(formData.get('postalCodes') || '')
      .split(/[\s,]+/)
      .map((z) => z.trim())
      .filter((z) => /^\d{5}$/.test(z)),
    isActive: formData.get('isActive') === 'on',
    deliveryFeeCents: inputToCents(formData.get('deliveryFeeCents')),
    deliveryMinimumCents: inputToCents(formData.get('deliveryMinimumCents')),
    freeDeliveryThresholdCents: inputToCents(formData.get('freeDeliveryThresholdCents')),
  };
  if (id) await prisma.deliveryZone.update({ where: { id }, data });
  else await prisma.deliveryZone.create({ data: { ...data, storeId: store.id } });
  revalidatePath(`/stores/${slug}`);
  return { ok: true };
}

export async function deleteZoneAction(slug: string, id: string): Promise<Result> {
  await requireRole(['STORE_MANAGER']);
  await prisma.deliveryZone.delete({ where: { id } });
  revalidatePath(`/stores/${slug}`);
  return { ok: true };
}

export async function upsertNoticeAction(slug: string, formData: FormData): Promise<Result> {
  await requireRole(['STORE_MANAGER']);
  const store = await prisma.store.findUniqueOrThrow({ where: { slug } });
  const id = String(formData.get('id') || '');
  const data = {
    title: String(formData.get('title') || 'Notice'),
    body: String(formData.get('body') || ''),
    level: String(formData.get('level') || 'info'),
    isActive: formData.get('isActive') === 'on',
  };
  if (id) await prisma.storeNotice.update({ where: { id }, data });
  else await prisma.storeNotice.create({ data: { ...data, storeId: store.id } });
  revalidatePath(`/stores/${slug}`);
  return { ok: true };
}

export async function regenerateSlotsAction(storeId: string): Promise<Result> {
  await requireRole(['STORE_MANAGER']);
  const n = await regenerateSlots(storeId);
  revalidatePath('/slots');
  return { ok: true, data: { slots: n } };
}

export async function toggleSlotAction(slotId: string, isActive: boolean): Promise<Result> {
  await requireRole(['STORE_MANAGER']);
  await prisma.fulfillmentSlot.update({ where: { id: slotId }, data: { isActive } });
  revalidatePath('/slots');
  return { ok: true };
}

// --------------------------------------------------------- promotions --------
export async function upsertPromotionAction(formData: FormData): Promise<Result> {
  const staff = await requireRole(['STORE_MANAGER']);
  const id = String(formData.get('id') || '');
  const name = String(formData.get('name') || '').trim();
  const type = String(formData.get('type') || 'PERCENT_OFF') as PromotionType;
  const scope = String(formData.get('scope') || 'ORDER') as PromotionScope;
  if (!name) return { ok: false, error: 'Name is required.' };

  const rawValue = Number(formData.get('value') || 0);
  const value = type === 'PERCENT_OFF' ? Math.round(rawValue * 100) : Math.round(rawValue * 100);
  const slug =
    (id ? String(formData.get('slug')) : name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) ||
    `promo-${Date.now()}`;

  const data = {
    name,
    description: String(formData.get('description') || '') || null,
    type,
    scope,
    value,
    minSubtotalCents: inputToCents(formData.get('minSubtotalCents')),
    priority: Number(formData.get('priority') || 0),
    isActive: formData.get('isActive') === 'on',
    isFeatured: formData.get('isFeatured') === 'on',
    storeId: String(formData.get('storeId') || '') || null,
  };

  const promo = id
    ? await prisma.promotion.update({ where: { id }, data })
    : await prisma.promotion.create({ data: { ...data, slug } });

  // targets
  const targetType = String(formData.get('targetType') || '');
  const targetId = String(formData.get('targetId') || '');
  if (!id && targetId) {
    if (targetType === 'product')
      await prisma.promotionProduct.create({ data: { promotionId: promo.id, productId: targetId } });
    else if (targetType === 'category')
      await prisma.promotionCategory.create({ data: { promotionId: promo.id, categoryId: targetId } });
    else if (targetType === 'department')
      await prisma.promotionCategory.create({ data: { promotionId: promo.id, departmentId: targetId } });
  }

  await writeAudit({
    actorId: staff.id,
    action: id ? 'UPDATE' : 'CREATE',
    entityType: 'Promotion',
    entityId: promo.id,
    after: { name, type, scope, value },
  });
  revalidatePath('/promotions');
  return { ok: true };
}

export async function togglePromotionAction(id: string, isActive: boolean): Promise<Result> {
  await requireRole(['STORE_MANAGER']);
  await prisma.promotion.update({ where: { id }, data: { isActive } });
  revalidatePath('/promotions');
  return { ok: true };
}

export async function upsertCouponAction(formData: FormData): Promise<Result> {
  await requireRole(['STORE_MANAGER']);
  const code = String(formData.get('code') || '').trim().toUpperCase();
  if (!code) return { ok: false, error: 'Code is required.' };
  const type = String(formData.get('type') || 'PERCENT_OFF') as 'PERCENT_OFF' | 'AMOUNT_OFF' | 'FREE_DELIVERY';
  const raw = Number(formData.get('value') || 0);
  const value = type === 'FREE_DELIVERY' ? 0 : type === 'PERCENT_OFF' ? Math.round(raw * 100) : Math.round(raw * 100);
  await prisma.coupon.upsert({
    where: { code },
    update: {
      type,
      value,
      minSubtotalCents: inputToCents(formData.get('minSubtotalCents')),
      isActive: formData.get('isActive') === 'on',
    },
    create: {
      code,
      type,
      value,
      minSubtotalCents: inputToCents(formData.get('minSubtotalCents')),
      isActive: true,
    },
  });
  revalidatePath('/coupons');
  return { ok: true };
}

// ---------------------------------------------------------------- staff -------
export async function upsertStaffAction(formData: FormData): Promise<Result> {
  const admin = await requireRole([]);
  if (admin.role !== 'ADMIN') return { ok: false, error: 'Only admins can manage staff.' };

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const role = String(formData.get('role') || 'PICKER') as UserRole;
  const storeId = String(formData.get('storeId') || '');
  const firstName = String(formData.get('firstName') || '').trim();
  const lastName = String(formData.get('lastName') || '').trim() || null;
  const password = String(formData.get('password') || '');
  if (!email || !firstName || !storeId) return { ok: false, error: 'Email, name and store are required.' };

  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { role, firstName, lastName, ...(passwordHash ? { passwordHash } : {}) },
      })
    : await prisma.user.create({
        data: {
          email,
          role,
          firstName,
          lastName,
          passwordHash: passwordHash ?? (await bcrypt.hash('password123', 10)),
        },
      });

  await prisma.staffProfile.upsert({
    where: { userId: user.id },
    update: {
      storeId,
      title: role,
      canPick: role === 'PICKER' || role === 'STORE_MANAGER',
      canButcher: role === 'BUTCHER',
      canManage: role === 'ADMIN' || role === 'STORE_MANAGER',
    },
    create: {
      userId: user.id,
      storeId,
      title: role,
      canPick: role === 'PICKER' || role === 'STORE_MANAGER',
      canButcher: role === 'BUTCHER',
      canManage: role === 'ADMIN' || role === 'STORE_MANAGER',
    },
  });
  await writeAudit({
    actorId: admin.id,
    action: existing ? 'UPDATE' : 'CREATE',
    entityType: 'StaffProfile',
    entityId: user.id,
    after: { email, role, storeId },
  });
  revalidatePath('/staff');
  return { ok: true };
}

export async function toggleStaffActiveAction(userId: string, isActive: boolean): Promise<Result> {
  const admin = await requireRole([]);
  if (admin.role !== 'ADMIN') return { ok: false, error: 'Only admins can manage staff.' };
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath('/staff');
  return { ok: true };
}
