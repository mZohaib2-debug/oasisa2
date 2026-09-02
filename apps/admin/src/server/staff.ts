import 'server-only';
import { prisma } from '@oasisa2/database';

export async function listStaff() {
  return prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'STORE_MANAGER', 'PICKER', 'BUTCHER', 'DRIVER'] } },
    orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    include: { staffProfile: { include: { store: { select: { shortName: true } } } } },
  });
}

export async function listCustomers(q?: string, page = 1, pageSize = 25) {
  const where = {
    role: 'CUSTOMER' as const,
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' as const } },
            { firstName: { contains: q, mode: 'insensitive' as const } },
            { lastName: { contains: q, mode: 'insensitive' as const } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };
  const [total, customers] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        customerProfile: true,
        _count: { select: { orders: true } },
      },
    }),
  ]);
  return { total, customers, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
