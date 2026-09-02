import 'server-only';
import { cookies } from 'next/headers';
import { prisma } from '@oasisa2/database';
import { getStaffUser } from './auth';

const SCOPE_COOKIE = 'oa2_admin_store';

export interface StoreScope {
  storeId: string;
  slug: string;
  shortName: string;
  state: string;
  all: { id: string; slug: string; shortName: string }[];
}

/** Which branch the admin is currently operating on. */
export async function getStoreScope(): Promise<StoreScope> {
  const [stores, user, jar] = await Promise.all([
    prisma.store.findMany({ orderBy: { name: 'asc' } }),
    getStaffUser(),
    cookies(),
  ]);

  const cookieSlug = jar.get(SCOPE_COOKIE)?.value;
  const preferred =
    stores.find((s) => s.slug === cookieSlug) ??
    stores.find((s) => s.id === user?.staffProfile?.storeId) ??
    stores[0]!;

  return {
    storeId: preferred.id,
    slug: preferred.slug,
    shortName: preferred.shortName,
    state: preferred.state,
    all: stores.map((s) => ({ id: s.id, slug: s.slug, shortName: s.shortName })),
  };
}

export async function setStoreScope(slug: string) {
  const jar = await cookies();
  jar.set(SCOPE_COOKIE, slug, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}
