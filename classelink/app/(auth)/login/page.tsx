import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getSchemaFromHostname } from '@/lib/db/tenant'
import { SUPER_ADMIN_SCHEMA } from '@/lib/auth/config'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Connexion' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string; admin?: string }>
}) {
  const params = await searchParams
  const headersList = await headers()
  const hostname = headersList.get('host') ?? ''

  // Détecter si on est sur le domaine admin ou si le paramètre ?admin est présent
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'classelink.ci'
  const isAdminDomain =
    hostname.startsWith('admin.') ||
    params.admin === '1' ||
    // En développement : si aucune école n'est configurée → mode super admin
    (process.env.NODE_ENV === 'development' && !process.env.DEV_SCHOOL_SCHEMA)

  const schemaName = isAdminDomain
    ? SUPER_ADMIN_SCHEMA
    : (await getSchemaFromHostname(hostname)) ?? ''

  const isSuperAdmin = schemaName === SUPER_ADMIN_SCHEMA

  return (
    <LoginForm
      schemaName={schemaName}
      isSuperAdmin={isSuperAdmin}
      error={params.error}
      callbackUrl={params.callbackUrl}
    />
  )
}
