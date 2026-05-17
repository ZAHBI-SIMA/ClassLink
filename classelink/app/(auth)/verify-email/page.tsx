import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Vérifiez votre email' }

export default function VerifyEmailPage() {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Vérifiez votre email</h2>
      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
        Un lien de connexion a été envoyé à votre adresse email.<br />
        Cliquez sur ce lien pour vous connecter.
      </p>
      <div className="space-y-2">
        <p className="text-xs text-gray-400">Le lien expire dans 10 minutes.</p>
        <Link href="/login" className="block text-sm text-blue-600 hover:text-blue-700 font-medium">
          ← Retour à la connexion
        </Link>
      </div>
    </div>
  )
}
