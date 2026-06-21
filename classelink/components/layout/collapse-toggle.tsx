'use client'

import { cn } from '@/lib/utils'

/**
 * Bouton réduire / agrandir la barre latérale.
 * Affiche un chevron (← réduire, → agrandir) et le libellé en mode agrandi.
 */
export function CollapseToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
      aria-label={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
      className={cn(
        'w-full flex items-center gap-3 rounded-lg text-sm font-medium',
        'text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors',
        collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
      )}
    >
      <svg
        className={cn('w-5 h-5 flex-shrink-0 transition-transform', collapsed && 'rotate-180')}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
      </svg>
      {!collapsed && <span className="flex-1 text-left">Réduire</span>}
    </button>
  )
}
