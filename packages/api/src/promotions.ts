import { prisma } from '@oasisa2/database';

/** Featured promotions ("Weekly Specials") for a store — for banners & the specials page. */
export async function getFeaturedPromotions(storeId: string) {
  const now = new Date();
  const promos = await prisma.promotion.findMany({
    where: {
      isActive: true,
      isFeatured: true,
      OR: [{ storeId: null }, { storeId }],
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { priority: 'desc' },
    include: {
      products: { include: { product: { select: { slug: true } } } },
      categories: {
        include: {
          category: { select: { slug: true, department: { select: { slug: true } } } },
          department: { select: { slug: true } },
        },
      },
    },
  });

  return promos.map((p) => {
    const firstCat = p.categories[0];
    let href = '/specials';
    if (p.products[0]) href = `/p/${p.products[0].product.slug}`;
    else if (firstCat?.category)
      href = `/c/${firstCat.category.department.slug}/${firstCat.category.slug}`;
    else if (firstCat?.department) href = `/d/${firstCat.department.slug}`;
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      type: p.type,
      href,
      endsAt: p.endsAt,
    };
  });
}

export async function listActiveCoupons() {
  const now = new Date();
  return prisma.coupon.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
  });
}
