'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/actions/auth'

const NAV = [
  {
    href: '/parent',
    label: 'Tableau de bord',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
]

export function ParentSidebar({ parentName, schoolName }: { parentName: string; schoolName?: string }) {
  const pathname = usePathname()
  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Parent</p>
        <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{parentName}</p>
        {schoolName && <p className="text-xs text-gray-400 truncate">{schoolName}</p>}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/parent' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${active ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              {item.icon}{item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 pb-4">
        <form action={logoutAction}>
          <button type="submit" className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  )
}
