'use client'

import { cn } from '@/lib/utils'
import { useSidebar } from './sidebar-context'

/** Bouton « hamburger » d'ouverture du tiroir, visible uniquement sur mobile/tablette. */
export function SidebarToggle({ className }: { className?: string }) {
  const { toggle } = useSidebar()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ouvrir le menu de navigation"
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 lg:hidden',
        className,
      )}
    >
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  )
}
