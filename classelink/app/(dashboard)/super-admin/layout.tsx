import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { SuperAdminSidebar } from '@/components/layout/super-admin-sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'

export const runtime = 'nodejs'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
