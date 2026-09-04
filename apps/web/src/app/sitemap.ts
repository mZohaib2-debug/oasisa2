import type { MetadataRoute } from 'next';
import { prisma } from '@oasisa2/database';
import { siteUrl } from '@/lib/site';

const BASE = siteUrl();

// Generated per request, not at build time.
export const dynamic = 'force-dynamic';

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  '',
  '/departments',
  '/specials',
  '/locations/glen-burnie',
  '/locations/fredericksburg',
].map((p) => ({ url: `${BASE}${p}`, changeFrequency: 'daily', priority: p === '' ? 1 : 0.7 }));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
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

    return [
      ...STATIC_ROUTES.filter((r) => !r.url.includes('/locations/')),
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
  } catch {
    // DB unreachable (e.g. during a build) — ship the static routes only.
    return STATIC_ROUTES;
  }
}
