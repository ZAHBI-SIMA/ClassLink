import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/db/tenant'
import { StudentSidebar } from '@/components/layout/student-sidebar'
import { SidebarProvider } from '@/components/layout/sidebar-context'
import { MobileTopbar } from '@/components/layout/mobile-topbar'
import { SchoolThemeFont, schoolThemeStyle } from '@/components/layout/school-theme'

export const runtime = 'nodejs'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user as any
  if (!user || user.role !== 'STUDENT') redirect('/login')

  let className = ''
  let theme: any = {}
  try {
    const db = getTenantPrisma(user.schemaName) as any
    const rows: any[] = await db.$queryRaw`
      SELECT c.name FROM students s
      LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'ACTIVE'
      LEFT JOIN classes c ON c.id = e.class_id
      WHERE s.user_id = ${user.id} LIMIT 1
    `
    className = rows[0]?.name ?? ''
    const settings: any[] = await db.$queryRaw`
      SELECT logo_url, slogan, primary_color, secondary_color, font_family
      FROM school_settings LIMIT 1
    `
    theme = settings[0] ?? {}
  } catch { /* ok */ }

  const studentName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()

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
        <StudentSidebar studentName={studentName} className={className} logoUrl={theme.logo_url} slogan={theme.slogan} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <MobileTopbar title={className || studentName} />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
