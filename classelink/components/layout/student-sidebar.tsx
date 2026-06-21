'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/actions/auth'
import { SidebarShell } from './sidebar-shell'
import { CollapseToggle } from './collapse-toggle'
import { useSidebarCollapsed } from '@/hooks/use-sidebar-collapsed'

type NavItem = {
  href: string
  label: string
  category?: string // undefined = section générale (en haut, sans titre)
  icon: React.ReactNode
}

const CATEGORY_ORDER = ['Scolarité', 'Travail', 'Motivation', 'Communication']

const NAV: NavItem[] = [
  {
    href: '/student',
    label: 'Mon espace',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    href: '/student/grades',
    label: 'Mes notes',
    category: 'Scolarité',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
  {
    href: '/student/attendance',
    label: 'Mes présences',
    category: 'Scolarité',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  },
  {
    href: '/student/payments',
    label: 'Mes paiements',
    category: 'Scolarité',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    href: '/student/schedule',
    label: 'Emploi du temps',
    category: 'Scolarité',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  },
  {
    href: '/student/assignments',
    label: 'Mes devoirs',
    category: 'Travail',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    href: '/student/bulletin',
    label: 'Bulletin',
    category: 'Scolarité',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    href: '/student/ranking',
    label: 'Classement',
    category: 'Motivation',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
  },
  {
    href: '/student/quiz',
    label: 'Quiz & QCM',
    category: 'Travail',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    href: '/student/badges',
    label: 'Badges & XP',
    category: 'Motivation',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
  },
  {
    href: '/student/todo',
    label: 'To-do liste',
    category: 'Travail',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7l2 2 4-4" /></svg>,
  },
  {
    href: '/student/goals',
    label: 'Objectifs',
    category: 'Travail',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  },
  {
    href: '/student/messages',
    label: 'Messages',
    category: 'Communication',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  },
]

export function StudentSidebar({ studentName, className, logoUrl, slogan }: { studentName: string; className?: string; logoUrl?: string | null; slogan?: string | null }) {
  const pathname = usePathname()
  const { collapsed, toggle } = useSidebarCollapsed()

  const renderLink = (item: NavItem) => {
    const active = item.href === '/student' ? pathname === '/student' : pathname.startsWith(item.href)
    return (
      <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
        className={`flex items-center gap-2.5 rounded-lg text-sm font-medium transition ${collapsed ? 'justify-center px-0 py-2' : 'px-3 py-2'} ${active ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
        {item.icon}{!collapsed && item.label}
      </Link>
    )
  }

  const generalNav = NAV.filter(item => !item.category)
  const groupedNav = CATEGORY_ORDER
    .map(category => ({ category, items: NAV.filter(item => item.category === category) }))
    .filter(group => group.items.length > 0)

  return (
    <SidebarShell className={`${collapsed ? 'w-16' : 'w-56'} flex-shrink-0 bg-white border-r border-gray-200 transition-all duration-200`}>
      <div className={`border-b border-gray-100 ${collapsed ? 'px-2 py-4 text-center' : 'px-5 py-4'}`}>
        {collapsed ? (
          logoUrl ? (
            <img src={logoUrl} alt="" className="w-7 h-7 rounded-lg object-cover mx-auto" />
          ) : (
            <p className="text-xs font-bold text-primary uppercase">Él.</p>
          )
        ) : (
          <>
            {logoUrl && <img src={logoUrl} alt="" className="w-7 h-7 rounded-lg object-cover mb-2" />}
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">{slogan || 'Élève'}</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{studentName}</p>
            {className && <p className="text-xs text-gray-400">{className}</p>}
          </>
        )}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="space-y-0.5">
          {generalNav.map(renderLink)}
        </div>
        {groupedNav.map(group => (
          <div key={group.category} className={collapsed ? 'pt-2 border-t border-gray-100 mt-2' : 'pt-3'}>
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {group.category}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(renderLink)}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-3 pb-4 space-y-0.5">
        <CollapseToggle collapsed={collapsed} onToggle={toggle} />
        <form action={logoutAction}>
          <button type="submit" title={collapsed ? 'Déconnexion' : undefined}
            className={`w-full flex items-center gap-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition ${collapsed ? 'justify-center px-0 py-2' : 'px-3 py-2'}`}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {!collapsed && 'Déconnexion'}
          </button>
        </form>
      </div>
    </SidebarShell>
  )
}
