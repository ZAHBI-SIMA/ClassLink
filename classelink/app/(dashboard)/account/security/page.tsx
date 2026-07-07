import { auth } from '@/lib/auth/config'
import { getTenantPrisma } from '@/lib/db/tenant'
import { redirect } from 'next/navigation'
import { SecurityClient } from './security-client'
import Link from 'next/link'

export const metadata = { title: 'Sécurité du compte' }

export default async function AccountSecurityPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sécurité du compte</h1>
            <p className="text-sm text-gray-500">Gérez la sécurité de votre compte MyClassLink.</p>
          </div>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-xl transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Retour
        </Link>
      </div>

      {/* Carte principale 2FA */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Bandeau supérieur */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Authentification à deux facteurs (2FA)
              </h2>
              <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                La 2FA ajoute une couche de protection supplémentaire à votre compte. En plus de votre mot
                de passe, vous devrez entrer un code généré par une application authenticator lors de
                chaque connexion.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <SecurityClient twoFactorEnabled={twoFactorEnabled} />
        </div>
      </div>

      {/* Carte conseils de sécurité */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-blue-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span className="text-sm font-semibold text-blue-800">Conseils de sécurité</span>
        </div>
        <ul className="space-y-2">
          {[
            'Utilisez un mot de passe unique et fort pour votre compte.',
            'Activez la 2FA pour une protection maximale.',
            'Ne partagez jamais vos codes d\'authentification.',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-blue-700">
              <svg className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
