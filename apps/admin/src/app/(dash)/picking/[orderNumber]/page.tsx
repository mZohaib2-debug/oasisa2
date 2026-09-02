import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { prisma } from '@oasisa2/database';
import { getOrderDetail } from '@/server/orders';
import { PickerItem } from '@/components/picker-item';
import { OrderStatusControls } from '@/components/order-status-controls';
import { Badge } from '@/components/stat-card';
import { orderStatusTone, slotLabel, statusLabel } from '@/lib/format';

type Props = { params: Promise<{ orderNumber: string }> };

export default async function PickingDetailPage({ params }: Props) {
  await requireRole(['PICKER', 'STORE_MANAGER']);
  const { orderNumber } = await params;
  const order = await getOrderDetail(orderNumber);
  if (!order) notFound();

  // aisle locations for this store
  const inv = await prisma.storeInventory.findMany({
    where: { storeId: order.storeId, productId: { in: order.items.map((i) => i.productId) } },
    select: { productId: true, aisle: true },
  });
  const aisleByProduct = new Map(inv.map((r) => [r.productId, r.aisle]));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link href="/picking" className="text-sm text-forest-700">
          ← Queue
        </Link>
        <h1 className="mt-1 flex items-center gap-2 text-xl font-bold text-ink-900">
          <span className="font-mono">{order.orderNumber}</span>
          <Badge tone={orderStatusTone(order.status)}>{statusLabel(order.status)}</Badge>
        </h1>
        <p className="text-sm text-ink-500">
          {order.fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Pickup'} ·{' '}
          {order.slot ? slotLabel(order.slot.date, order.slot.startTime, order.slot.endTime) : 'ASAP'} ·{' '}
          {order.contactName}
        </p>
      </div>

      <div className="space-y-2">
        {order.items.map((i) => (
          <PickerItem
            key={i.id}
            item={{
              id: i.id,
              name: i.nameSnapshot,
              sku: i.skuSnapshot,
              unitType: i.unitType,
              quantity: i.quantity,
              requestedWeightLb: i.requestedWeightLb ? Number(i.requestedWeightLb) : null,
              aisle: aisleByProduct.get(i.productId) ?? null,
              status: i.status,
              substitution: i.substitution,
              butcherSelections: i.butcherInstruction?.selections ?? null,
              butcherNotes: i.butcherInstruction?.notes ?? null,
              hasButcher: Boolean(i.butcherInstruction) || i.unitType === 'WEIGHT',
            }}
          />
        ))}
      </div>

      <div className="card p-4">
        <p className="label mb-2">When everything is picked / cut</p>
        <OrderStatusControls orderId={order.id} status={order.status} />
      </div>
    </div>
  );
}
