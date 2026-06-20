'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Props {
  href: string
  icon: React.ReactNode
  label: string
  badge?: number
  exact?: boolean
}

export function SidebarLink({ href, icon, label, badge, exact = false }: Props) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      <span className={cn('w-5 h-5 flex-shrink-0', active ? 'text-primary' : 'text-gray-400')}>
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}
