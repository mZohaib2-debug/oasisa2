import { NextResponse } from 'next/server';
import { getStoreContext } from '@/lib/store-context';

export async function GET() {
  const ctx = await getStoreContext();
  return NextResponse.json({
    store: ctx.store,
    fulfillmentType: ctx.fulfillmentType,
    deliveryPostalCode: ctx.deliveryPostalCode,
    deliveryQuote: ctx.deliveryQuote,
    chosen: ctx.chosen,
  });
}
