import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { AdminShell } from '@/components/admin/AdminShell';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  title: {
    default: 'RPB Admin',
    template: '%s | RPB Admin',
  },
  description:
    "Panel d'administration RPB - Gestion des bots, tournois et utilisateurs.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  // Check admin role
  if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
    redirect('/dashboard');
  }

  return <AdminShell>{children}</AdminShell>;
}
