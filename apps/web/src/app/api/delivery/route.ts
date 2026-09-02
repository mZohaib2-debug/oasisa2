import { NextResponse } from 'next/server';
import { checkDeliveryEligibility } from '@oasisa2/api';
import { postalCodeSchema } from '@oasisa2/validation';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const store = url.searchParams.get('store');
  const zip = url.searchParams.get('zip');
  if (!store || !zip) {
    return NextResponse.json({ error: 'store and zip are required' }, { status: 400 });
  }
  if (!postalCodeSchema.safeParse(zip).success) {
    return NextResponse.json({ error: 'Invalid ZIP code' }, { status: 400 });
  }
  const quote = await checkDeliveryEligibility(store, zip);
  if (!quote) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
  return NextResponse.json(quote);
}
