import { redirect } from 'next/navigation';
import { requireStaff } from '@/lib/auth';
import { listStaff } from '@/server/staff';
import { listStoresAdmin } from '@/server/stores';
import { ActionForm, Field, Select } from '@/components/action-form';
import { ActionButton } from '@/components/ui';
import { toggleStaffActiveAction, upsertStaffAction } from '@/app/actions';

export default async function StaffPage() {
  const me = await requireStaff();
  if (me.role !== 'ADMIN') redirect('/');

  const [staff, stores] = await Promise.all([listStaff(), listStoresAdmin()]);
  const storeOptions = stores.map((s) => ({ value: s.id, label: s.shortName }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        <h1 className="mb-3 text-xl font-bold text-ink-900">Staff</h1>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="border-b border-ink-200 bg-ink-50">
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Role</th>
                <th className="th">Store</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => (
                <tr key={u.id} className="border-b border-ink-100 last:border-0">
                  <td className="td font-medium">
                    {[u.firstName, u.lastName].filter(Boolean).join(' ')}
                  </td>
                  <td className="td text-ink-500">{u.email}</td>
                  <td className="td">{u.role}</td>
                  <td className="td text-ink-500">{u.staffProfile?.store.shortName ?? '—'}</td>
                  <td className="td">
                    <ActionButton
                      action={toggleStaffActiveAction.bind(null, u.id, !u.isActive)}
                      className={u.isActive ? 'btn bg-forest-600 text-white' : 'btn-secondary'}
                    >
                      {u.isActive ? 'Active' : 'Disabled'}
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card h-fit p-4">
        <h2 className="mb-3 font-bold text-ink-900">Add / update staff</h2>
        <ActionForm action={upsertStaffAction} submitLabel="Save staff member" resetOnSuccess>
          <Field label="Email" name="email" type="email" required hint="Existing email updates the account." />
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" name="firstName" required />
            <Field label="Last name" name="lastName" />
          </div>
          <Select
            label="Role"
            name="role"
            defaultValue="PICKER"
            options={[
              { value: 'PICKER', label: 'Picker' },
              { value: 'BUTCHER', label: 'Butcher' },
              { value: 'STORE_MANAGER', label: 'Store manager' },
              { value: 'ADMIN', label: 'Admin' },
              { value: 'DRIVER', label: 'Driver' },
            ]}
          />
          <Select label="Store" name="storeId" options={storeOptions} />
          <Field label="Password" name="password" type="password" hint="Leave blank to keep current / default password123 for new." />
        </ActionForm>
      </div>
    </div>
  );
}
