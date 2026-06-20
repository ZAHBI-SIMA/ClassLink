'use client'

import { cn } from '@/lib/utils'
import { useSidebar } from './sidebar-context'

/**
 * Conteneur responsive partagé par toutes les barres latérales.
 * - Mobile : tiroir coulissant en surimpression avec fond assombri.
 * - Bureau (lg+) : barre fixe statique, toujours visible.
 */
export function SidebarShell({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { open, close } = useSidebar()

  return (
    <>
      {/* Fond assombri (mobile uniquement) */}
      <div
        onClick={close}
        aria-hidden
        className={cn(
          'fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full flex-col transition-transform duration-300 ease-in-out',
          'lg:static lg:z-auto lg:translate-x-0 lg:transition-none',
          open ? 'translate-x-0' : '-translate-x-full',
          className,
        )}
      >
        {children}
      </aside>
    </>
  )
}
