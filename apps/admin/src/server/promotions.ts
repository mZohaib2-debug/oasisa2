import 'server-only';
import { prisma } from '@oasisa2/database';

export async function listPromotionsAdmin() {
  return prisma.promotion.findMany({
    orderBy: [{ isActive: 'desc' }, { priority: 'desc' }],
    include: {
      store: { select: { shortName: true } },
      _count: { select: { products: true, categories: true } },
    },
  });
}

export async function getPromotionAdmin(id: string) {
  return prisma.promotion.findUnique({
    where: { id },
    include: {
      products: { include: { product: { select: { name: true, slug: true } } } },
      categories: {
        include: {
          category: { select: { name: true } },
          department: { select: { name: true } },
        },
      },
    },
  });
}

export async function listCouponsAdmin() {
  return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
}
