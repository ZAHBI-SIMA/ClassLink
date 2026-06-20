import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { SidebarProvider } from '@/components/layout/sidebar-context'
import { SchoolThemeFont, schoolThemeStyle } from '@/components/layout/school-theme'
import { getTenantPrisma } from '@/lib/db/tenant'
import { getSchoolPlanBySchema } from '@/lib/plan/current'
import { featureForPath, hasFeature } from '@/lib/plan/features'
import { moduleForPath } from '@/lib/permissions/modules'

export const runtime = 'nodejs'

const ALLOWED_ROLES = ['ADMIN', 'CENSOR', 'ACCOUNTANT', 'STAFF']

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
  let theme: any = {}
  let allowedModules: string[] = []
  try {
    const db = getTenantPrisma(user.schemaName) as any
    const settings = await db.$queryRaw`
      SELECT school_name, logo_url, slogan, primary_color, secondary_color, font_family
      FROM school_settings LIMIT 1
    ` as any[]
    schoolName = settings[0]?.school_name ?? schoolName
    theme = settings[0] ?? {}

    if (user.role === 'STAFF') {
      const rows = await db.$queryRaw`
        SELECT allowed_modules FROM users WHERE id = ${user.id} LIMIT 1
      ` as { allowed_modules: string[] }[]
      allowedModules = rows[0]?.allowed_modules ?? []
    }
  } catch {
    // Silencieux si les settings ne sont pas encore configurés
  }

  // Gating par module pour le personnel (STAFF). Le tableau de bord reste accessible ;
  // toute page sans module autorisé (y compris /admin/settings/*) renvoie au tableau de bord.
  if (user.role === 'STAFF') {
    const isDashboard = pathname === '/admin' || pathname === ''
    const mod = moduleForPath(pathname)
    if (!isDashboard && (!mod || !allowedModules.includes(mod))) {
      redirect('/admin')
    }
  }

  return (
    <SidebarProvider>
      <SchoolThemeFont fontFamily={theme.font_family} />
      <div
        className="flex h-screen bg-gray-50 overflow-hidden"
        style={schoolThemeStyle({
          primaryColor:   theme.primary_color,
          secondaryColor: theme.secondary_color,
          fontFamily:     theme.font_family,
        })}
      >
        <AdminSidebar
          schoolName={schoolName}
          role={user?.role}
          planSlug={planInfo?.planSlug}
          logoUrl={theme.logo_url}
          slogan={theme.slogan}
          allowedModules={allowedModules}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
