import { requireStaff } from '@/lib/auth';
import { getStoreScope } from '@/lib/store-scope';
import { AppShell } from '@/components/app-shell';

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const scope = await getStoreScope();

  return (
    <AppShell
      user={{
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Staff',
        role: user.role,
      }}
      scope={{ slug: scope.slug, shortName: scope.shortName, all: scope.all }}
    >
      {children}
    </AppShell>
  );
}
