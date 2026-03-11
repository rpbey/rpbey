import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: {
    default: 'Pièces & Beyblades | RPB',
    template: '%s | RPB',
  },
  description: 'Base de données des pièces et Beyblades X.',
};

export default function PublicPartsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
