import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { getTenantPrisma } from '@/lib/db/tenant'
import { getSchoolPlanBySchema } from '@/lib/plan/current'
import { featureForPath, hasFeature } from '@/lib/plan/features'

export const runtime = 'nodejs'

const ALLOWED_ROLES = ['ADMIN', 'CENSOR', 'ACCOUNTANT']

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user as any

  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    redirect('/login')
  }

  // Forfait & statut de l'école
  const planInfo = await getSchoolPlanBySchema(user.schemaName)

  // Accès bloqué tant que l'abonnement n'est pas réglé
  if (planInfo && planInfo.status !== 'ACTIVE' && planInfo.status !== 'TRIAL') {
    redirect(`/register/payment?school=${planInfo.schoolId}`)
  }

  // Gating par forfait : empêche l'accès direct (URL) aux pages premium non incluses
  const pathname = (await headers()).get('x-pathname') ?? ''
  const requiredFeature = featureForPath(pathname)
  if (requiredFeature && !hasFeature(planInfo?.planSlug, requiredFeature)) {
    redirect('/admin?upgrade=1')
  }

  let schoolName: string | undefined = planInfo?.schoolName
  try {
    const db = getTenantPrisma(user.schemaName) as any
    const settings = await db.$queryRaw`
      SELECT school_name FROM school_settings LIMIT 1
    ` as { school_name: string }[]
    schoolName = settings[0]?.school_name ?? schoolName
  } catch {
    // Silencieux si les settings ne sont pas encore configurés
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar schoolName={schoolName} role={user?.role} planSlug={planInfo?.planSlug} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
