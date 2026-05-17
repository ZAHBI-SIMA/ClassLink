import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/db/tenant'
import { StudentSidebar } from '@/components/layout/student-sidebar'

export const runtime = 'nodejs'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user as any
  if (!user || user.role !== 'STUDENT') redirect('/login')

  let className = ''
  try {
    const db = getTenantPrisma(user.schemaName) as any
    const rows: any[] = await db.$queryRaw`
      SELECT c.name FROM students s
      LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'ACTIVE'
      LEFT JOIN classes c ON c.id = e.class_id
      WHERE s.user_id = ${user.id} LIMIT 1
    `
    className = rows[0]?.name ?? ''
  } catch { /* ok */ }

  const studentName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <StudentSidebar studentName={studentName} className={className} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
