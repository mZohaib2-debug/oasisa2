import type { MetadataRoute } from 'next';
import { prisma } from '@oasisa2/database';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [departments, categories, products, stores] = await Promise.all([
    prisma.department.findMany({ where: { isActive: true }, select: { slug: true } }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, department: { select: { slug: true } } },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.store.findMany({ select: { slug: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = ['', '/departments', '/specials'].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: 'daily',
    priority: p === '' ? 1 : 0.7,
  }));

  return [
    ...staticRoutes,
    ...stores.map((s) => ({ url: `${BASE}/locations/${s.slug}`, priority: 0.6 })),
    ...departments.map((d) => ({ url: `${BASE}/d/${d.slug}`, priority: 0.6 })),
    ...categories.map((c) => ({
      url: `${BASE}/c/${c.department.slug}/${c.slug}`,
      priority: 0.5,
    })),
    ...products.map((p) => ({
      url: `${BASE}/p/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.5,
    })),
  ];
}
