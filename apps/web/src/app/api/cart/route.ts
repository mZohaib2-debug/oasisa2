import { NextResponse } from 'next/server';
import { getActiveCartView } from '@/lib/cart';

export async function GET() {
  const view = await getActiveCartView();
  return NextResponse.json(view ?? { lines: [], totals: null });
}
