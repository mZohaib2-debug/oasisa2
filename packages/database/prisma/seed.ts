/**
 * OasisA2 seed — DEMO DATA ONLY.
 *
 * Creates: 2 stores (placeholder addresses), store hours, placeholder delivery
 * zones, 17 departments, ~45 categories, 10 brands, 120+ demo products with
 * per-store price & inventory, butcher options, promotions, coupons, 7 days of
 * fulfillment slots, staff & a demo customer with favorites / a saved list /
 * one completed order (so "Buy Again" has data).
 *
 * Idempotent: safe to run repeatedly (uses upserts on natural keys).
 */
import bcrypt from 'bcryptjs';
import {
  DEFAULT_TAX_RATE,
  SLOT_CONFIG,
  STORE_PLACEHOLDERS,
} from '@oasisa2/config';
import { formatOrderNumber, generateSlots } from '@oasisa2/commerce';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  ALL_SEED_PRODUCTS,
  BRANDS,
  BUTCHER_OPTIONS_BY_KIND,
  COUPONS,
  PROMOTIONS,
  TAXONOMY,
  type SeedProduct,
  type SeedStoreOverride,
} from '../src/seed-data';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'password123';

function dec(n: number | undefined | null): Prisma.Decimal | null {
  return n == null ? null : new Prisma.Decimal(n);
}

async function seedStores() {
  const stores = [];
  for (const s of STORE_PLACEHOLDERS) {
    const store = await prisma.store.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        slug: s.slug,
        name: s.name,
        shortName: s.shortName,
        state: s.state,
        phone: s.phone,
        line1: s.line1,
        city: s.city,
        postalCode: s.postalCode,
        pickupEnabled: s.pickupEnabled,
        deliveryEnabled: s.deliveryEnabled,
        pickupPrepMinutes: s.pickupPrepMinutes,
        deliveryPrepMinutes: s.deliveryPrepMinutes,
        deliveryFeeCents: s.deliveryFeeCents,
        deliveryMinimumCents: s.deliveryMinimumCents,
        freeDeliveryThresholdCents: s.freeDeliveryThresholdCents,
      },
    });

    for (const h of s.placeholderHours) {
      await prisma.storeHours.upsert({
        where: { storeId_dayOfWeek: { storeId: store.id, dayOfWeek: h.dayOfWeek } },
        update: { opensAt: h.opensAt, closesAt: h.closesAt, isClosed: h.opensAt == null },
        create: {
          storeId: store.id,
          dayOfWeek: h.dayOfWeek,
          opensAt: h.opensAt,
          closesAt: h.closesAt,
          isClosed: h.opensAt == null,
        },
      });
    }

    const existingZone = await prisma.deliveryZone.findFirst({
      where: { storeId: store.id, name: 'Placeholder Delivery Area' },
    });
    if (!existingZone) {
      await prisma.deliveryZone.create({
        data: {
          storeId: store.id,
          name: 'Placeholder Delivery Area',
          postalCodes: s.placeholderDeliveryPostalCodes,
          isActive: true,
        },
      });
    }

    const existingNotice = await prisma.storeNotice.findFirst({
      where: { storeId: store.id, title: 'Store details coming soon' },
    });
    if (!existingNotice) {
      await prisma.storeNotice.create({
        data: {
          storeId: store.id,
          title: 'Store details coming soon',
          body: `Address, phone and hours for the ${s.shortName} branch are placeholders and will be confirmed by store staff.`,
          level: 'info',
          isActive: true,
        },
      });
    }

    stores.push(store);
  }
  return stores;
}

async function seedTaxonomy() {
  const categoryIdBySlug = new Map<string, string>();
  const subcategoryIdByKey = new Map<string, string>();
  const departmentIdBySlug = new Map<string, string>();

  for (let d = 0; d < TAXONOMY.length; d++) {
    const dept = TAXONOMY[d]!;
    const department = await prisma.department.upsert({
      where: { slug: dept.slug },
      update: { name: dept.name, iconName: dept.iconName, description: dept.description, sortOrder: d },
      create: {
        slug: dept.slug,
        name: dept.name,
        iconName: dept.iconName,
        description: dept.description,
        sortOrder: d,
      },
    });
    departmentIdBySlug.set(dept.slug, department.id);

    for (let c = 0; c < dept.categories.length; c++) {
      const cat = dept.categories[c]!;
      const category = await prisma.category.upsert({
        where: { departmentId_slug: { departmentId: department.id, slug: cat.slug } },
        update: { name: cat.name, sortOrder: c },
        create: { departmentId: department.id, slug: cat.slug, name: cat.name, sortOrder: c },
      });
      categoryIdBySlug.set(cat.slug, category.id);

      for (let sc = 0; sc < cat.subcategories.length; sc++) {
        const sub = cat.subcategories[sc]!;
        const subcategory = await prisma.subcategory.upsert({
          where: { categoryId_slug: { categoryId: category.id, slug: sub.slug } },
          update: { name: sub.name, sortOrder: sc },
          create: { categoryId: category.id, slug: sub.slug, name: sub.name, sortOrder: sc },
        });
        subcategoryIdByKey.set(`${cat.slug}/${sub.slug}`, subcategory.id);
      }
    }
  }

  return { categoryIdBySlug, subcategoryIdByKey, departmentIdBySlug };
}

async function seedBrands() {
  const brandIdBySlug = new Map<string, string>();
  for (const b of BRANDS) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name },
      create: { slug: b.slug, name: b.name, isDemo: true },
    });
    brandIdBySlug.set(b.slug, brand.id);
  }
  return brandIdBySlug;
}

function overrideFor(p: SeedProduct, storeSlug: string): SeedStoreOverride {
  return (storeSlug === 'glen-burnie' ? p.glenBurnie : p.fredericksburg) ?? {};
}

async function seedProducts(
  stores: { id: string; slug: string }[],
  maps: Awaited<ReturnType<typeof seedTaxonomy>>,
  brandIdBySlug: Map<string, string>,
) {
  const productIdBySlug = new Map<string, string>();

  for (const p of ALL_SEED_PRODUCTS) {
    const departmentId = maps.departmentIdBySlug.get(p.departmentSlug);
    const categoryId = maps.categoryIdBySlug.get(p.categorySlug);
    if (!departmentId || !categoryId) {
      throw new Error(`Missing taxonomy for ${p.sku} (${p.departmentSlug}/${p.categorySlug})`);
    }
    const subcategoryId = p.subcategorySlug
      ? maps.subcategoryIdByKey.get(`${p.categorySlug}/${p.subcategorySlug}`) ?? null
      : null;

    const isWeight = p.unitType === 'WEIGHT';
    const basePriceCents = isWeight ? (p.pricePerPoundCents ?? 0) : (p.basePriceCents ?? 0);

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        shortDescription: p.shortDescription,
        description: p.description ?? null,
        departmentId,
        categoryId,
        subcategoryId,
        brandId: p.brandSlug ? (brandIdBySlug.get(p.brandSlug) ?? null) : null,
        unitType: p.unitType,
        packageSize: p.packageSize ?? null,
        netWeightLb: dec(p.netWeightLb),
        basePriceCents,
        compareAtPriceCents: p.compareAtPriceCents ?? null,
        pricePerPoundCents: p.pricePerPoundCents ?? null,
        averageWeightLb: dec(p.averageWeightLb),
        taxStatus: p.taxStatus ?? 'EXEMPT',
        halalStatus: p.halalStatus ?? 'NOT_APPLICABLE',
        ingredients: p.ingredients ?? null,
        allergens: p.allergens ?? [],
        countryOfOrigin: p.countryOfOrigin ?? null,
        storageInstructions: p.storageInstructions ?? null,
        isFeatured: p.featured ?? false,
        isNewArrival: p.newArrival ?? false,
        isDemo: true,
      },
      create: {
        sku: p.sku,
        slug: p.slug,
        name: p.name,
        shortDescription: p.shortDescription,
        description: p.description ?? null,
        departmentId,
        categoryId,
        subcategoryId,
        brandId: p.brandSlug ? (brandIdBySlug.get(p.brandSlug) ?? null) : null,
        unitType: p.unitType,
        packageSize: p.packageSize ?? null,
        netWeightLb: dec(p.netWeightLb),
        basePriceCents,
        compareAtPriceCents: p.compareAtPriceCents ?? null,
        pricePerPoundCents: p.pricePerPoundCents ?? null,
        averageWeightLb: dec(p.averageWeightLb),
        taxStatus: p.taxStatus ?? 'EXEMPT',
        halalStatus: p.halalStatus ?? 'NOT_APPLICABLE',
        ingredients: p.ingredients ?? null,
        allergens: p.allergens ?? [],
        countryOfOrigin: p.countryOfOrigin ?? null,
        storageInstructions: p.storageInstructions ?? null,
        isFeatured: p.featured ?? false,
        isNewArrival: p.newArrival ?? false,
        isDemo: true,
      },
    });
    productIdBySlug.set(p.slug, product.id);

    // primary placeholder image
    const hasImage = await prisma.productImage.findFirst({ where: { productId: product.id } });
    if (!hasImage) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: `/images/products/${p.slug}.svg`,
          alt: p.name,
          isPrimary: true,
          sortOrder: 0,
        },
      });
    }

    // keywords
    for (const keyword of new Set([...p.keywords, p.name.toLowerCase()])) {
      await prisma.productKeyword.upsert({
        where: { productId_keyword: { productId: product.id, keyword } },
        update: {},
        create: { productId: product.id, keyword },
      });
    }

    // variants
    if (p.variants?.length) {
      for (let i = 0; i < p.variants.length; i++) {
        const v = p.variants[i]!;
        await prisma.productVariant.upsert({
          where: { sku: v.sku },
          update: {
            name: v.name,
            packageSize: v.packageSize,
            priceDeltaCents: v.priceDeltaCents,
            isDefault: v.isDefault ?? false,
            sortOrder: i,
          },
          create: {
            productId: product.id,
            sku: v.sku,
            name: v.name,
            packageSize: v.packageSize,
            priceDeltaCents: v.priceDeltaCents,
            isDefault: v.isDefault ?? false,
            sortOrder: i,
          },
        });
      }
    }

    // butcher options
    if (p.butcher) {
      for (let i = 0; i < BUTCHER_OPTIONS_BY_KIND[p.butcher].length; i++) {
        const opt = BUTCHER_OPTIONS_BY_KIND[p.butcher][i]!;
        await prisma.butcherOption.upsert({
          where: {
            productId_group_value: { productId: product.id, group: opt.group, value: opt.value },
          },
          update: { label: opt.label, isDefault: opt.isDefault ?? false, sortOrder: i },
          create: {
            productId: product.id,
            group: opt.group,
            value: opt.value,
            label: opt.label,
            isDefault: opt.isDefault ?? false,
            sortOrder: i,
          },
        });
      }
    }

    // per-store price + inventory
    for (const store of stores) {
      const ov = overrideFor(p, store.slug);
      await prisma.storePrice.upsert({
        where: { storeId_productId: { storeId: store.id, productId: product.id } },
        update: {
          priceCents: basePriceCents,
          salePriceCents: ov.salePriceCents ?? null,
          compareAtPriceCents: p.compareAtPriceCents ?? null,
          pricePerPoundCents: p.pricePerPoundCents ?? null,
          saleStartsAt: ov.salePriceCents ? new Date(Date.now() - 86_400_000) : null,
          saleEndsAt: ov.salePriceCents ? new Date(Date.now() + 6 * 86_400_000) : null,
        },
        create: {
          storeId: store.id,
          productId: product.id,
          priceCents: basePriceCents,
          salePriceCents: ov.salePriceCents ?? null,
          compareAtPriceCents: p.compareAtPriceCents ?? null,
          pricePerPoundCents: p.pricePerPoundCents ?? null,
          saleStartsAt: ov.salePriceCents ? new Date(Date.now() - 86_400_000) : null,
          saleEndsAt: ov.salePriceCents ? new Date(Date.now() + 6 * 86_400_000) : null,
        },
      });

      const qty = ov.quantityOnHand ?? 24;
      const state =
        ov.state ?? (qty <= 0 ? 'OUT_OF_STOCK' : qty <= 6 ? 'LOW_STOCK' : 'IN_STOCK');
      const existingInv = await prisma.storeInventory.findFirst({
        where: { storeId: store.id, productId: product.id, variantId: null },
      });
      if (existingInv) {
        await prisma.storeInventory.update({
          where: { id: existingInv.id },
          data: { quantityOnHand: qty, state },
        });
      } else {
        await prisma.storeInventory.create({
          data: {
            storeId: store.id,
            productId: product.id,
            quantityOnHand: qty,
            state,
            lowStockThreshold: 6,
            aisle: p.departmentSlug.slice(0, 2).toUpperCase(),
          },
        });
      }
    }
  }

  return productIdBySlug;
}

async function seedPromotions(
  stores: { id: string; slug: string }[],
  maps: Awaited<ReturnType<typeof seedTaxonomy>>,
  productIdBySlug: Map<string, string>,
) {
  for (const promo of PROMOTIONS) {
    const storeId = promo.storeSlug
      ? (stores.find((s) => s.slug === promo.storeSlug)?.id ?? null)
      : null;
    const record = await prisma.promotion.upsert({
      where: { slug: promo.slug },
      update: {
        name: promo.name,
        description: promo.description,
        type: promo.type,
        scope: promo.scope,
        value: promo.value,
        minSubtotalCents: promo.minSubtotalCents ?? null,
        priority: promo.priority ?? 0,
        isFeatured: promo.isFeatured ?? false,
        storeId,
        startsAt: new Date(Date.now() - 86_400_000),
        endsAt: new Date(Date.now() + 6 * 86_400_000),
      },
      create: {
        slug: promo.slug,
        name: promo.name,
        description: promo.description,
        type: promo.type,
        scope: promo.scope,
        value: promo.value,
        minSubtotalCents: promo.minSubtotalCents ?? null,
        priority: promo.priority ?? 0,
        isFeatured: promo.isFeatured ?? false,
        storeId,
        startsAt: new Date(Date.now() - 86_400_000),
        endsAt: new Date(Date.now() + 6 * 86_400_000),
      },
    });

    await prisma.promotionProduct.deleteMany({ where: { promotionId: record.id } });
    await prisma.promotionCategory.deleteMany({ where: { promotionId: record.id } });

    for (const slug of promo.productSlugs ?? []) {
      const productId = productIdBySlug.get(slug);
      if (productId) {
        await prisma.promotionProduct.create({ data: { promotionId: record.id, productId } });
      }
    }
    for (const slug of promo.categorySlugs ?? []) {
      const categoryId = maps.categoryIdBySlug.get(slug);
      if (categoryId) {
        await prisma.promotionCategory.create({ data: { promotionId: record.id, categoryId } });
      }
    }
    for (const slug of promo.departmentSlugs ?? []) {
      const departmentId = maps.departmentIdBySlug.get(slug);
      if (departmentId) {
        await prisma.promotionCategory.create({ data: { promotionId: record.id, departmentId } });
      }
    }
  }

  for (const c of COUPONS) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {
        type: c.type,
        value: c.value,
        minSubtotalCents: c.minSubtotalCents ?? null,
        perCustomerLimit: c.perCustomerLimit ?? 1,
        isActive: true,
      },
      create: {
        code: c.code,
        type: c.type,
        value: c.value,
        minSubtotalCents: c.minSubtotalCents ?? null,
        perCustomerLimit: c.perCustomerLimit ?? 1,
        isActive: true,
      },
    });
  }
}

async function seedSlots(stores: { id: string; slug: string }[]) {
  for (const store of stores) {
    const hours = await prisma.storeHours.findMany({ where: { storeId: store.id } });
    const hoursByWeekday: Record<number, { opensAt: string | null; closesAt: string | null }> = {};
    for (const h of hours) hoursByWeekday[h.dayOfWeek] = { opensAt: h.opensAt, closesAt: h.closesAt };

    for (const type of ['PICKUP', 'DELIVERY'] as const) {
      const slots = generateSlots(type, {
        fromDate: new Date(),
        horizonDays: SLOT_CONFIG.horizonDays,
        slotMinutes: SLOT_CONFIG.slotMinutes,
        dayStart: SLOT_CONFIG.dayStart,
        dayEnd: SLOT_CONFIG.dayEnd,
        capacity: SLOT_CONFIG.defaultCapacity,
        prepMinutes: type === 'PICKUP' ? 120 : 180,
        hoursByWeekday,
      });
      for (const s of slots) {
        await prisma.fulfillmentSlot.upsert({
          where: {
            storeId_type_date_startTime: {
              storeId: store.id,
              type,
              date: new Date(s.date),
              startTime: s.startTime,
            },
          },
          update: { capacity: s.capacity, endTime: s.endTime },
          create: {
            storeId: store.id,
            type,
            date: new Date(s.date),
            startTime: s.startTime,
            endTime: s.endTime,
            capacity: s.capacity,
          },
        });
      }
    }
  }
}

async function seedPeopleAndDemoOrder(
  stores: { id: string; slug: string }[],
  productIdBySlug: Map<string, string>,
) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const glenBurnie = stores.find((s) => s.slug === 'glen-burnie')!;

  const staffDefs = [
    { email: 'admin@oasisa2.test', role: 'ADMIN' as const, first: 'Aisha', last: 'Admin', canManage: true },
    { email: 'manager.gb@oasisa2.test', role: 'STORE_MANAGER' as const, first: 'Bilal', last: 'Manager', canManage: true },
    { email: 'picker.gb@oasisa2.test', role: 'PICKER' as const, first: 'Sana', last: 'Picker', canPick: true },
    { email: 'butcher.gb@oasisa2.test', role: 'BUTCHER' as const, first: 'Omar', last: 'Butcher', canButcher: true },
  ];

  for (const s of staffDefs) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { role: s.role, firstName: s.first, lastName: s.last, passwordHash },
      create: { email: s.email, role: s.role, firstName: s.first, lastName: s.last, passwordHash },
    });
    await prisma.staffProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        storeId: glenBurnie.id,
        title: s.role,
        canPick: s.role === 'PICKER' || s.role === 'STORE_MANAGER',
        canButcher: s.role === 'BUTCHER',
        canManage: Boolean(s.canManage),
      },
    });
  }

  const customer = await prisma.user.upsert({
    where: { email: 'customer@oasisa2.test' },
    update: { passwordHash },
    create: {
      email: 'customer@oasisa2.test',
      role: 'CUSTOMER',
      firstName: 'Fatima',
      lastName: 'Khan',
      passwordHash,
      customerProfile: {
        create: {
          preferredStoreId: glenBurnie.id,
          preferredFulfillment: 'PICKUP',
          marketingOptIn: true,
          referralCode: 'FATIMA10',
        },
      },
    },
    include: { customerProfile: true },
  });

  const favSlugs = ['halal-ground-beef', 'white-basmati-rice', 'shan-biryani-masala'];
  for (const slug of favSlugs) {
    const productId = productIdBySlug.get(slug);
    if (productId) {
      await prisma.favorite.upsert({
        where: { userId_productId: { userId: customer.id, productId } },
        update: {},
        create: { userId: customer.id, productId },
      });
    }
  }

  const listExists = await prisma.savedList.findFirst({
    where: { userId: customer.id, name: 'Weekly Groceries' },
  });
  if (!listExists) {
    await prisma.savedList.create({
      data: {
        userId: customer.id,
        name: 'Weekly Groceries',
        isDefault: true,
        items: {
          create: [
            { productId: productIdBySlug.get('chakki-fresh-atta')!, quantity: 1 },
            { productId: productIdBySlug.get('masoor-dal-red-lentils')!, quantity: 2 },
            { productId: productIdBySlug.get('plain-whole-milk-yogurt')!, quantity: 1 },
            { productId: productIdBySlug.get('yellow-onions')!, requestedWeightLb: new Prisma.Decimal(3) },
          ].filter((i) => i.productId),
        },
      },
    });
  }

  // One completed order so Buy Again / order history has data.
  const orderExists = await prisma.order.findFirst({ where: { userId: customer.id } });
  if (!orderExists) {
    const seq = await prisma.order.count();
    const beefId = productIdBySlug.get('halal-ground-beef')!;
    const riceId = productIdBySlug.get('white-basmati-rice')!;
    const masalaId = productIdBySlug.get('shan-biryani-masala')!;

    const beefLine = Math.round(599 * 2); // 2 lb @ sale
    const riceLine = 699;
    const masalaLine = 199 * 2;
    const subtotal = beefLine + riceLine + masalaLine;

    await prisma.order.create({
      data: {
        orderNumber: formatOrderNumber(seq),
        userId: customer.id,
        storeId: glenBurnie.id,
        contactName: 'Fatima Khan',
        contactEmail: 'customer@oasisa2.test',
        contactPhone: '555-0100',
        fulfillmentType: 'PICKUP',
        status: 'COMPLETED',
        subtotalCents: subtotal,
        discountCents: 0,
        deliveryFeeCents: 0,
        taxCents: 0,
        estimatedTotalCents: subtotal,
        finalTotalCents: subtotal,
        placedAt: new Date(Date.now() - 10 * 86_400_000),
        completedAt: new Date(Date.now() - 9 * 86_400_000),
        items: {
          create: [
            {
              productId: beefId,
              nameSnapshot: 'Halal Ground Beef',
              skuSnapshot: 'MEAT-BEEF-GROUND',
              unitType: 'WEIGHT',
              quantity: 1,
              requestedWeightLb: new Prisma.Decimal(2),
              actualWeightLb: new Prisma.Decimal(2.05),
              unitPriceCents: 599,
              estimatedLineCents: beefLine,
              finalLineCents: Math.round(599 * 2.05),
              status: 'PACKED',
            },
            {
              productId: riceId,
              nameSnapshot: 'White Basmati Rice',
              skuSnapshot: 'RICE-BASMATI-WHITE',
              unitType: 'EACH',
              quantity: 1,
              unitPriceCents: riceLine,
              estimatedLineCents: riceLine,
              finalLineCents: riceLine,
              status: 'PACKED',
            },
            {
              productId: masalaId,
              nameSnapshot: 'Shan Bombay Biryani Masala',
              skuSnapshot: 'MASALA-SHAN-BIRYANI',
              unitType: 'EACH',
              quantity: 2,
              unitPriceCents: 199,
              estimatedLineCents: masalaLine,
              finalLineCents: masalaLine,
              status: 'PACKED',
            },
          ],
        },
        statusHistory: {
          create: [
            { status: 'RECEIVED' },
            { status: 'CONFIRMED' },
            { status: 'PACKED' },
            { status: 'READY_FOR_PICKUP' },
            { status: 'COMPLETED' },
          ],
        },
      },
    });
  }
}

async function main() {
  console.log('Seeding OasisA2 demo data (tax rate default %s)...', DEFAULT_TAX_RATE);
  const stores = await seedStores();
  console.log('  stores: %d', stores.length);
  const maps = await seedTaxonomy();
  console.log('  departments: %d, categories: %d', maps.departmentIdBySlug.size, maps.categoryIdBySlug.size);
  const brandIdBySlug = await seedBrands();
  console.log('  brands: %d', brandIdBySlug.size);
  const productIdBySlug = await seedProducts(stores, maps, brandIdBySlug);
  console.log('  products: %d', productIdBySlug.size);
  await seedPromotions(stores, maps, productIdBySlug);
  console.log('  promotions: %d, coupons: %d', PROMOTIONS.length, COUPONS.length);
  await seedSlots(stores);
  const slotCount = await prisma.fulfillmentSlot.count();
  console.log('  fulfillment slots: %d', slotCount);
  await seedPeopleAndDemoOrder(stores, productIdBySlug);
  console.log('  staff + demo customer + 1 completed order');
  console.log('Done. Demo logins use password: %s', DEMO_PASSWORD);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
