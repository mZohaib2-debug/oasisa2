import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// TEMPORARY diagnostic route — remove once the deploy is verified.
export async function GET() {
  const out: Record<string, unknown> = {
    node: process.version,
    platform: `${process.platform}-${process.arch}`,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'MISSING',
      DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL ? 'set' : 'MISSING',
      AUTH_SECRET: process.env.AUTH_SECRET ? `set(${process.env.AUTH_SECRET.length})` : 'MISSING',
    },
  };

  try {
    const { getServerEnv } = await import('@oasisa2/config');
    getServerEnv();
    out.envValidation = 'ok';
  } catch (e) {
    out.envValidation = e instanceof Error ? e.message : String(e);
  }

  try {
    const { prisma } = await import('@oasisa2/database');
    out.storeCount = await prisma.store.count();
    out.productCount = await prisma.product.count();
    out.db = 'ok';
  } catch (e) {
    out.db = 'FAILED';
    out.dbError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    out.dbStack = e instanceof Error ? (e.stack || '').split('\n').slice(0, 12) : null;
  }

  return NextResponse.json(out, { status: 200 });
}
