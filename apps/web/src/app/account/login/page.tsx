import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthForms } from '@/components/auth-forms';
import { getCurrentUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/account');
  return (
    <div>
      <h1 className="mb-4 text-center text-2xl font-black text-charcoal-900">Your OasisA2 account</h1>
      <AuthForms />
    </div>
  );
}
