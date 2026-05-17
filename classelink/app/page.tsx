import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function RootPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const role = (session.user as any).role as string

  const redirectMap: Record<string, string> = {
    SUPER_ADMIN: '/super-admin',
    ADMIN: '/admin',
    CENSOR: '/admin/attendance',
    ACCOUNTANT: '/accountant/payments',
    TEACHER: '/teacher',
    PARENT: '/parent',
    STUDENT: '/student',
  }

  redirect(redirectMap[role] ?? '/login')
}
