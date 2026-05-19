'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '',                  label: 'Aperçu'          },
  { href: '/notes',            label: 'Notes & Moyennes' },
  { href: '/devoirs',          label: 'Devoirs'          },
  { href: '/emploi-du-temps',  label: 'Emploi du temps'  },
]

export function ChildTabs({ studentId }: { studentId: string }) {
  const pathname = usePathname()
  const base = `/parent/children/${studentId}`

  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
      {TABS.map(tab => {
        const href    = base + tab.href
        const active  = tab.href === ''
          ? pathname === base
          : pathname.startsWith(href)
        return (
          <Link key={tab.href} href={href}
            className={`flex-1 text-center px-3 py-1.5 rounded-lg text-xs font-semibold transition
              ${active
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
