import 'server-only';
import { prisma, type Prisma } from '@oasisa2/database';

export async function listProductsAdmin(params: {
  q?: string;
  departmentSlug?: string;
  storeId: string;
  onlyIssues?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 30;
  const where: Prisma.ProductWhereInput = {};
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: 'insensitive' } },
      { sku: { contains: params.q, mode: 'insensitive' } },
      { barcode: { contains: params.q } },
    ];
  }
  if (params.departmentSlug) where.department = { slug: params.departmentSlug };
  if (params.onlyIssues) {
    where.inventory = { some: { storeId: params.storeId, state: { in: ['OUT_OF_STOCK', 'LOW_STOCK'] } } };
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        department: { select: { name: true } },
        category: { select: { name: true } },
        brand: { select: { name: true } },
        prices: { where: { storeId: params.storeId } },
        inventory: { where: { storeId: params.storeId, variantId: null } },
      },
    }),
  ]);

  return { total, products, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getProductAdmin(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      department: true,
      category: true,
      subcategory: true,
      brand: true,
      variants: { orderBy: { sortOrder: 'asc' } },
      images: { orderBy: { sortOrder: 'asc' } },
      butcherOptions: { orderBy: { sortOrder: 'asc' } },
      keywords: true,
      prices: { include: { store: { select: { shortName: true, slug: true } } } },
      inventory: {
        where: { variantId: null },
        include: { store: { select: { shortName: true, slug: true } } },
      },
    },
  });
}

export async function catalogTaxonomy() {
  return prisma.department.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      categories: {
        orderBy: { sortOrder: 'asc' },
        include: { subcategories: { orderBy: { sortOrder: 'asc' } } },
      },
    },
  });
}

export async function listBrandsAdmin() {
  return prisma.brand.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });
}
