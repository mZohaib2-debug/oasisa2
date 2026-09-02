import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { listCustomers } from '@/server/staff';
import { formatCents, formatDate } from '@/lib/format';

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function CustomersPage({ searchParams }: Props) {
  await requireRole(['STORE_MANAGER']);
  const sp = await searchParams;
  const page = Number(sp.page || 1);
  const { customers, total, totalPages } = await listCustomers(sp.q, page);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ink-900">Customers</h1>
      <form action="/customers" className="flex gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Name, email, phone" className="field max-w-xs" />
        <button className="btn-secondary" type="submit">
          Search
        </button>
      </form>
      <p className="text-sm text-ink-500">{total} customers</p>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="border-b border-ink-200 bg-ink-50">
            <tr>
              <th className="th">Name</th>
              <th className="th">Email / phone</th>
              <th className="th">Joined</th>
              <th className="th">Orders</th>
              <th className="th">Store credit</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-ink-100 last:border-0">
                <td className="td font-medium">
                  {[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}
                </td>
                <td className="td text-ink-500">
                  {c.email ?? c.phone ?? '—'}
                </td>
                <td className="td text-ink-500">{formatDate(c.createdAt)}</td>
                <td className="td">
                  <Link href={`/orders?q=${c.email ?? ''}`} className="text-forest-700">
                    {c._count.orders}
                  </Link>
                </td>
                <td className="td">{formatCents(c.customerProfile?.storeCreditCents ?? 0)}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td className="td text-ink-500" colSpan={5}>
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={`/customers?q=${sp.q ?? ''}&page=${page - 1}`} className="btn-secondary">
              Previous
            </Link>
          )}
          <span className="self-center text-ink-500">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/customers?q=${sp.q ?? ''}&page=${page + 1}`} className="btn-secondary">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
