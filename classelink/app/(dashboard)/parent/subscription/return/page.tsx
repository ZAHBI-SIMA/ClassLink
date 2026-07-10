import Link from 'next/link'
import { getParentSubscriptionStatus } from '@/actions/parent'

export const metadata = { title: 'Abonnement MyClassLink' }

export default async function SubscriptionReturnPage() {
  const result = await getParentSubscriptionStatus()
  const isSuccess = result.success && !!result.data?.paid
  const isError = !result.success

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center space-y-6">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto
          ${isSuccess ? 'bg-green-100' : isError ? 'bg-red-100' : 'bg-yellow-100'}`}>
          {isSuccess ? (
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <div>
          <h1 className={`text-2xl font-bold ${isSuccess ? 'text-green-700' : 'text-yellow-700'}`}>
            {isSuccess ? 'Abonnement activé !' : 'Paiement en cours…'}
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            {isSuccess
              ? 'Votre abonnement MyClassLink est actif pour l\'année scolaire en cours. Toutes les fonctionnalités sont désormais déverrouillées.'
              : 'Le paiement est en cours de traitement. Cette page se mettra à jour automatiquement une fois la confirmation reçue.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/parent"
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition">
            Retour au tableau de bord
          </Link>
          {!isSuccess && (
            <Link href="/parent/subscription/return"
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition">
              Actualiser
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
