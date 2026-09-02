import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { getServerEnv } from '@oasisa2/config';
import { prisma } from '@oasisa2/database';

const SESSION_COOKIE = 'oa2_session';
const ANON_COOKIE = 'oa2_anon';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 60,
};

function sign(value: string): string {
  const mac = crypto
    .createHmac('sha256', getServerEnv().AUTH_SECRET)
    .update(value)
    .digest('base64url');
  return `${value}.${mac}`;
}

function verify(signed: string | undefined): string | null {
  if (!signed) return null;
  const idx = signed.lastIndexOf('.');
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  const expected = sign(value);
  return crypto.timingSafeEqual(Buffer.from(signed), Buffer.from(expected)) ? value : null;
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  return verify(jar.get(SESSION_COOKIE)?.value);
}

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    include: { customerProfile: true, staffProfile: true },
  });
}

export async function setSession(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sign(userId), COOKIE_OPTS);
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Stable anonymous id for guest carts. Created on demand. */
export async function getOrCreateAnonymousId(): Promise<string> {
  const jar = await cookies();
  const existing = verify(jar.get(ANON_COOKIE)?.value);
  if (existing) return existing;
  const id = `anon_${crypto.randomUUID()}`;
  jar.set(ANON_COOKIE, sign(id), COOKIE_OPTS);
  return id;
}

/** Read-only variant for server components (cannot set cookies during render). */
export async function peekAnonymousId(): Promise<string | null> {
  const jar = await cookies();
  return verify(jar.get(ANON_COOKIE)?.value);
}
