import { auth } from '@/lib/auth/config'
import { getTenantPrisma } from '@/lib/db/tenant'
import { redirect } from 'next/navigation'
import { SecurityClient } from './security-client'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'

export const metadata = { title: 'Sécurité du compte' }

export default async function AccountSecurityPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Les super admins n'ont pas de schéma tenant
  let twoFactorEnabled = false
  if (session.user.schemaName && session.user.schemaName !== '__super_admin__') {
    try {
      const db = getTenantPrisma(session.user.schemaName) as any
      const rows: any[] = await db.$queryRaw`
        SELECT two_factor_enabled FROM users WHERE id = ${session.user.id} LIMIT 1
      `
      twoFactorEnabled = rows[0]?.two_factor_enabled ?? false
    } catch {
      // ignore
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Sécurité du compte"
        description="Gérez la sécurité de votre compte ClasseLink."
        action={
          <Link
            href="/"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
          >
            ← Retour
          </Link>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          Authentification à deux facteurs (2FA)
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          La 2FA ajoute une couche de protection supplémentaire à votre compte. En plus de votre mot
          de passe, vous devrez entrer un code généré par une application authenticator lors de
          chaque connexion.
        </p>

        <SecurityClient twoFactorEnabled={twoFactorEnabled} />
      </div>
    </div>
  )
}
