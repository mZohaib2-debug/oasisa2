import { redirect } from 'next/navigation';
import { getStaffUser } from '@/lib/auth';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const user = await getStaffUser();
  if (user) redirect('/');

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-forest-700 text-lg font-black text-white">
            O
          </span>
          <div>
            <p className="text-lg font-black text-ink-900">OasisA2</p>
            <p className="text-xs text-ink-500">Staff operations</p>
          </div>
        </div>
        <LoginForm />
        <p className="mt-3 text-center text-xs text-ink-500">
          Demo: admin@oasisa2.test · manager.gb · picker.gb · butcher.gb — all{' '}
          <span className="font-mono">password123</span>
        </p>
      </div>
    </div>
  );
}
