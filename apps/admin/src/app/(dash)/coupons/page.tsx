import { requireRole } from '@/lib/auth';
import { listCouponsAdmin } from '@/server/promotions';
import { ActionForm, Field, Select, Toggle } from '@/components/action-form';
import { upsertCouponAction } from '@/app/actions';
import { formatCents } from '@/lib/format';

export default async function CouponsPage() {
  await requireRole(['STORE_MANAGER']);
  const coupons = await listCouponsAdmin();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="mb-3 text-xl font-bold text-ink-900">Coupons</h1>
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-ink-200 bg-ink-50">
              <tr>
                <th className="th">Code</th>
                <th className="th">Type</th>
                <th className="th">Value</th>
                <th className="th">Min</th>
                <th className="th">Used</th>
                <th className="th">Active</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-ink-100 last:border-0">
                  <td className="td font-mono font-semibold">{c.code}</td>
                  <td className="td">{c.type.replace('_', ' ').toLowerCase()}</td>
                  <td className="td">
                    {c.type === 'FREE_DELIVERY'
                      ? 'free delivery'
                      : c.type === 'PERCENT_OFF'
                        ? `${c.value / 100}%`
                        : formatCents(c.value)}
                  </td>
                  <td className="td">{c.minSubtotalCents ? formatCents(c.minSubtotalCents) : '—'}</td>
                  <td className="td text-ink-500">
                    {c.redemptionCount}
                    {c.maxRedemptions ? ` / ${c.maxRedemptions}` : ''}
                  </td>
                  <td className="td">{c.isActive ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card h-fit p-4">
        <h2 className="mb-3 font-bold text-ink-900">Add / update coupon</h2>
        <ActionForm action={upsertCouponAction} submitLabel="Save coupon" resetOnSuccess>
          <Field label="Code" name="code" required hint="Uppercased. Existing code updates it." />
          <Select
            label="Type"
            name="type"
            defaultValue="PERCENT_OFF"
            options={[
              { value: 'PERCENT_OFF', label: 'Percent off' },
              { value: 'AMOUNT_OFF', label: 'Amount off' },
              { value: 'FREE_DELIVERY', label: 'Free delivery' },
            ]}
          />
          <Field label="Value (% or $)" name="value" type="number" step="0.01" hint="Ignored for free delivery" />
          <Field label="Min subtotal ($)" name="minSubtotalCents" type="number" step="0.01" />
          <Toggle label="Active" name="isActive" defaultChecked />
        </ActionForm>
      </div>
    </div>
  );
}
