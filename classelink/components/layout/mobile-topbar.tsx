'use client'

import { SidebarToggle } from './sidebar-toggle'

/**
 * Barre supérieure mobile pour les espaces sans en-tête (parent, élève, enseignant).
 * Fournit le bouton hamburger d'accès à la navigation. Masquée sur bureau (lg+).
 */
export function MobileTopbar({ title }: { title?: string }) {
  return (
    <header className="flex h-14 flex-shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-3 lg:hidden">
      <SidebarToggle />
      <span className="truncate text-sm font-semibold text-gray-900">{title || 'ClasseLink'}</span>
    </header>
  )
}
