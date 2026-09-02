import { expandQuery } from '@oasisa2/commerce';
import { prisma, type Prisma } from '@oasisa2/database';
import type { ProductFilterInput } from '@oasisa2/validation';
import { resolvePrice } from './pricing';

export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  brandName: string | null;
  packageSize: string | null;
  unitType: 'EACH' | 'WEIGHT';
  imageUrl: string | null;
  halalStatus: string;
  unitPriceCents: number;
  wasPriceCents: number | null;
  onSale: boolean;
  percentOff: number | null;
  averageWeightLb: number | null;
  inventoryState: string;
  available: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  departmentSlug: string;
  categorySlug: string;
}

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  packageSize: true,
  unitType: true,
  halalStatus: true,
  basePriceCents: true,
  compareAtPriceCents: true,
  pricePerPoundCents: true,
  averageWeightLb: true,
  isFeatured: true,
  isNewArrival: true,
  brand: { select: { name: true } },
  department: { select: { slug: true } },
  category: { select: { slug: true } },
  images: { where: { isPrimary: true }, take: 1, select: { url: true } },
  prices: true,
  inventory: true,
} satisfies Prisma.ProductSelect;

type RawProduct = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export function toProductCard(p: RawProduct, storeId: string): ProductCard {
  const price = resolvePrice(p, storeId);
  const inv = p.inventory.find((i) => i.storeId === storeId && i.variantId == null);
  const available =
    !!inv &&
    inv.state !== 'OUT_OF_STOCK' &&
    inv.state !== 'TEMPORARILY_UNAVAILABLE' &&
    inv.quantityOnHand - inv.quantityReserved > 0;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brandName: p.brand?.name ?? null,
    packageSize: p.packageSize,
    unitType: p.unitType,
    imageUrl: p.images[0]?.url ?? null,
    halalStatus: p.halalStatus,
    unitPriceCents: price.unitPriceCents,
    wasPriceCents: price.wasPriceCents,
    onSale: price.onSale,
    percentOff: price.percentOff,
    averageWeightLb: p.averageWeightLb ? Number(p.averageWeightLb) : null,
    inventoryState: inv?.state ?? 'OUT_OF_STOCK',
    available,
    isFeatured: p.isFeatured,
    isNewArrival: p.isNewArrival,
    departmentSlug: p.department.slug,
    categorySlug: p.category.slug,
  };
}

export async function getDepartmentBySlug(slug: string) {
  return prisma.department.findUnique({
    where: { slug },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { subcategories: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
      },
    },
  });
}

export async function getCategoryBySlug(departmentSlug: string, categorySlug: string) {
  const department = await prisma.department.findUnique({ where: { slug: departmentSlug } });
  if (!department) return null;
  return prisma.category.findUnique({
    where: { departmentId_slug: { departmentId: department.id, slug: categorySlug } },
    include: {
      department: true,
      subcategories: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
    },
  });
}

export async function listBrands() {
  return prisma.brand.findMany({ orderBy: { name: 'asc' } });
}

/** Department -> category navigation tree for the header + browse screens. */
export async function getNavigationTree() {
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          subcategories: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  });
  return departments;
}

function orderBy(sort: ProductFilterInput['sort']): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'newest':
      return [{ createdAt: 'desc' }];
    case 'price_asc':
      return [{ basePriceCents: 'asc' }];
    case 'price_desc':
      return [{ basePriceCents: 'desc' }];
    case 'popular':
      return [{ isFeatured: 'desc' }, { name: 'asc' }];
    default:
      return [{ isFeatured: 'desc' }, { isNewArrival: 'desc' }, { name: 'asc' }];
  }
}

export interface ProductListResult {
  items: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listProducts(
  filter: ProductFilterInput,
  storeId: string,
): Promise<ProductListResult> {
  const where: Prisma.ProductWhereInput = { isActive: true };
  const and: Prisma.ProductWhereInput[] = [];

  if (filter.department) where.department = { slug: filter.department };
  if (filter.category) where.category = { slug: filter.category };
  if (filter.subcategory) where.subcategory = { slug: filter.subcategory };
  if (filter.brand) where.brand = { slug: filter.brand };
  if (filter.halalOnly) where.halalStatus = { in: ['HALAL', 'HALAL_CERTIFIED'] };

  if (filter.q) {
    const terms = expandQuery(filter.q);
    and.push({
      OR: [
        { name: { contains: filter.q, mode: 'insensitive' } },
        { shortDescription: { contains: filter.q, mode: 'insensitive' } },
        { brand: { name: { contains: filter.q, mode: 'insensitive' } } },
        { category: { name: { contains: filter.q, mode: 'insensitive' } } },
        { keywords: { some: { keyword: { in: terms } } } },
        ...terms.map((t) => ({ name: { contains: t, mode: 'insensitive' as const } })),
      ],
    });
  }

  if (filter.minPriceCents != null) and.push({ basePriceCents: { gte: filter.minPriceCents } });
  if (filter.maxPriceCents != null) and.push({ basePriceCents: { lte: filter.maxPriceCents } });

  if (filter.inStockOnly) {
    and.push({
      inventory: {
        some: { storeId, variantId: null, state: { in: ['IN_STOCK', 'LOW_STOCK'] } },
      },
    });
  }
  if (filter.onSaleOnly) {
    and.push({ prices: { some: { storeId, salePriceCents: { not: null } } } });
  }
  if (and.length) where.AND = and;

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: cardSelect,
      orderBy: orderBy(filter.sort),
      skip: (filter.page - 1) * filter.pageSize,
      take: filter.pageSize,
    }),
  ]);

  let items = rows.map((r) => toProductCard(r, storeId));
  // price sorts must respect store-resolved effective price
  if (filter.sort === 'price_asc') items = items.sort((a, b) => a.unitPriceCents - b.unitPriceCents);
  if (filter.sort === 'price_desc') items = items.sort((a, b) => b.unitPriceCents - a.unitPriceCents);

  return {
    items,
    total,
    page: filter.page,
    pageSize: filter.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filter.pageSize)),
  };
}

export async function getProductDetail(slug: string, storeId: string) {
  const p = await prisma.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      department: true,
      category: true,
      subcategory: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      butcherOptions: { orderBy: { sortOrder: 'asc' } },
      prices: true,
      inventory: true,
    },
  });
  if (!p || !p.isActive) return null;

  const price = resolvePrice(p, storeId);
  const inv = p.inventory.find((i) => i.storeId === storeId && i.variantId == null);
  const available =
    !!inv && ['IN_STOCK', 'LOW_STOCK'].includes(inv.state) && inv.quantityOnHand - inv.quantityReserved > 0;

  const butcherGroups: Record<string, { value: string; label: string; isDefault: boolean }[]> = {};
  for (const o of p.butcherOptions) {
    (butcherGroups[o.group] ??= []).push({ value: o.value, label: o.label, isDefault: o.isDefault });
  }

  const related = await prisma.product.findMany({
    where: { categoryId: p.categoryId, id: { not: p.id }, isActive: true },
    select: cardSelect,
    take: 8,
  });

  return {
    id: p.id,
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    description: p.description,
    brandName: p.brand?.name ?? null,
    department: { slug: p.department.slug, name: p.department.name },
    category: { slug: p.category.slug, name: p.category.name },
    subcategory: p.subcategory ? { slug: p.subcategory.slug, name: p.subcategory.name } : null,
    unitType: p.unitType,
    packageSize: p.packageSize,
    halalStatus: p.halalStatus,
    halalCertifier: p.halalCertifier,
    ingredients: p.ingredients,
    allergens: p.allergens,
    nutrition: p.nutrition,
    countryOfOrigin: p.countryOfOrigin,
    storageInstructions: p.storageInstructions,
    isDemo: p.isDemo,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    price: {
      unitPriceCents: price.unitPriceCents,
      wasPriceCents: price.wasPriceCents,
      onSale: price.onSale,
      percentOff: price.percentOff,
    },
    averageWeightLb: p.averageWeightLb ? Number(p.averageWeightLb) : null,
    variants: p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      packageSize: v.packageSize,
      priceDeltaCents: v.priceDeltaCents,
      isDefault: v.isDefault,
    })),
    butcherGroups,
    inventoryState: inv?.state ?? 'OUT_OF_STOCK',
    available,
    related: related.map((r) => toProductCard(r, storeId)),
  };
}

export async function getMerchandisingRails(storeId: string) {
  const [featured, newArrivals, onSale] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true, isFeatured: true }, select: cardSelect, take: 12 }),
    prisma.product.findMany({
      where: { isActive: true, isNewArrival: true },
      select: cardSelect,
      take: 12,
    }),
    prisma.product.findMany({
      where: { isActive: true, prices: { some: { storeId, salePriceCents: { not: null } } } },
      select: cardSelect,
      take: 12,
    }),
  ]);
  return {
    featured: featured.map((r) => toProductCard(r, storeId)),
    newArrivals: newArrivals.map((r) => toProductCard(r, storeId)),
    weeklySpecials: onSale.map((r) => toProductCard(r, storeId)),
  };
}

export async function searchSuggest(q: string, storeId: string, limit = 8) {
  if (!q.trim()) return { products: [], categories: [], brands: [] };
  const terms = expandQuery(q);
  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { keywords: { some: { keyword: { in: terms } } } },
        ],
      },
      select: cardSelect,
      take: limit,
    }),
    prisma.category.findMany({
      where: { isActive: true, name: { contains: q, mode: 'insensitive' } },
      select: { slug: true, name: true, department: { select: { slug: true } } },
      take: 4,
    }),
    prisma.brand.findMany({ where: { name: { contains: q, mode: 'insensitive' } }, take: 4 }),
  ]);
  return {
    products: products.map((r) => toProductCard(r, storeId)),
    categories,
    brands: brands.map((b) => ({ slug: b.slug, name: b.name })),
  };
}
