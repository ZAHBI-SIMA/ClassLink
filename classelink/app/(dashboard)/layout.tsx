import type { ReactNode } from 'react'
import { AutoRefresh } from '@/components/layout/auto-refresh'

/**
 * Layout partagé par tous les espaces (admin, parent, student, super-admin,
 * teacher, account). Monte un seul `<AutoRefresh/>` pour rafraîchir
 * automatiquement les données de chaque page du logiciel.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AutoRefresh />
    </>
  )
}
