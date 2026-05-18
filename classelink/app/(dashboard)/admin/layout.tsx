import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { getTenantPrisma } from '@/lib/db/tenant'

export const runtime = 'nodejs'

const ALLOWED_ROLES = ['ADMIN', 'CENSOR', 'ACCOUNTANT']

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user as any

  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    redirect('/login')
  }

  let schoolName: string | undefined
  try {
    const db = getTenantPrisma(user.schemaName) as any
    const settings = await db.$queryRaw`
      SELECT school_name FROM school_settings LIMIT 1
    ` as { school_name: string }[]
    schoolName = settings[0]?.school_name
  } catch {
    // Silencieux si les settings ne sont pas encore configurés
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar schoolName={schoolName} role={user?.role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
