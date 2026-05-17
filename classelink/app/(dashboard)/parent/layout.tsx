import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/db/tenant'
import { ParentSidebar } from '@/components/layout/parent-sidebar'

export const runtime = 'nodejs'

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user as any
  if (!user || user.role !== 'PARENT') redirect('/login')

  let schoolName = ''
  try {
    const db = getTenantPrisma(user.schemaName) as any
    const rows: any[] = await db.$queryRaw`SELECT school_name FROM school_settings LIMIT 1`
    schoolName = rows[0]?.school_name ?? ''
  } catch { /* ok */ }

  const parentName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <ParentSidebar parentName={parentName} schoolName={schoolName} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
