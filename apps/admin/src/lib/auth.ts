import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerEnv } from '@oasisa2/config';
import { prisma, type UserRole } from '@oasisa2/database';

const SESSION_COOKIE = 'oa2_admin_session';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 12,
};

const STAFF_ROLES: UserRole[] = ['ADMIN', 'STORE_MANAGER', 'PICKER', 'BUTCHER'];

function sign(value: string): string {
  const mac = crypto.createHmac('sha256', getServerEnv().AUTH_SECRET).update(value).digest('base64url');
  return `${value}.${mac}`;
}
function verify(signed: string | undefined): string | null {
  if (!signed) return null;
  const idx = signed.lastIndexOf('.');
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  try {
    return crypto.timingSafeEqual(Buffer.from(signed), Buffer.from(sign(value))) ? value : null;
  } catch {
    return null;
  }
}

export type StaffUser = NonNullable<Awaited<ReturnType<typeof getStaffUser>>>;

export async function getStaffUser() {
  const jar = await cookies();
  const userId = verify(jar.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { staffProfile: { include: { store: true } } },
  });
  if (!user || !user.isActive || !STAFF_ROLES.includes(user.role)) return null;
  return user;
}

/** Use at the top of every protected page/layout. */
export async function requireStaff() {
  const user = await getStaffUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireStaff();
  if (user.role !== 'ADMIN' && !roles.includes(user.role)) {
    redirect('/'); // not authorized for this section
  }
  return user;
}

export function canManageCatalog(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'STORE_MANAGER';
}
export function canManageStores(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'STORE_MANAGER';
}

export async function setStaffSession(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sign(userId), COOKIE_OPTS);
}
export async function clearStaffSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
