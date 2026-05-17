import type { Metadata } from 'next'
import { ResetPasswordForm } from './reset-password-form'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Nouveau mot de passe' }

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
          <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.834-2.694-.834-3.464 0L3.34 16.5c-.77.833.193 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Lien invalide</h2>
        <p className="text-sm text-gray-500 mb-4">Ce lien de réinitialisation est invalide ou expiré.</p>
        <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Refaire la demande
        </Link>
      </div>
    )
  }

  return <ResetPasswordForm token={token} />
}
