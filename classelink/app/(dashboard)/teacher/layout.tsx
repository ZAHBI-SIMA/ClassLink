import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/db/tenant'
import { TeacherSidebar } from '@/components/layout/teacher-sidebar'

export const runtime = 'nodejs'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user as any

  if (!user || !['TEACHER', 'ADMIN', 'CENSOR'].includes(user.role)) {
    redirect('/login')
  }

  let schoolName = ''
  let teacherName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()

  try {
    const db = getTenantPrisma(user.schemaName) as any
    const rows: any[] = await db.$queryRaw`
      SELECT school_name FROM school_settings LIMIT 1
    `
    schoolName = rows[0]?.school_name ?? ''
  } catch { /* ok */ }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <TeacherSidebar teacherName={teacherName} schoolName={schoolName} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
