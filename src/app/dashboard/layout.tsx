import { DashboardShell } from '@/components/dashboard/DashboardShell';

export const metadata = {
  title: 'Tableau de bord',
  description: 'Votre espace personnel RPB',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
