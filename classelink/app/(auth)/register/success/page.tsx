import type { Metadata } from 'next'
import Link from 'next/link'
import { activateSchoolIfPaid, getRegistrationInfo } from '@/actions/register'
import { AutoLogin } from './auto-login'

export const metadata: Metadata = { title: 'Inscription confirmée' }
export const runtime = 'nodejs'

interface Props {
  searchParams: Promise<{ school?: string }>
}

export default async function RegisterSuccessPage({ searchParams }: Props) {
  const { school: schoolId } = await searchParams

  if (!schoolId) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-600">Établissement non spécifié.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-blue-600">Accueil</Link>
      </div>
    )
  }

  // Vérifie le paiement auprès de GeniusPay et active si confirmé (sécurité en plus du webhook)
  const result = await activateSchoolIfPaid(schoolId)
  const info = await getRegistrationInfo(schoolId)
  const activated = result.activated || info?.status === 'ACTIVE'
  const failed = result.status === 'FAILED'

  if (activated) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-green-700">Établissement activé !</h2>
        <p className="mt-2 text-sm text-gray-600">
          {info?.schoolName ? `${info.schoolName} est prêt.` : 'Votre établissement est prêt.'}{' '}
          Vous avez accès aux fonctionnalités du forfait {info?.planName ?? ''}.
        </p>
        {/* Connexion automatique à l'espace dédié */}
        <AutoLogin schoolId={schoolId} />
      </div>
    )
  }

  if (failed) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-red-700">Paiement échoué</h2>
        <p className="mt-2 text-sm text-gray-600">Le paiement n’a pas abouti. Vous pouvez réessayer.</p>
        <Link href={`/register/payment?school=${schoolId}`}
          className="mt-6 inline-block rounded-xl bg-blue-600 px-7 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          Réessayer le paiement
        </Link>
      </div>
    )
  }

  // En attente
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
        <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-yellow-700">Paiement en cours…</h2>
      <p className="mt-2 text-sm text-gray-600">
        Nous confirmons votre paiement. Cette page se mettra à jour automatiquement.
      </p>
      <Link href={`/register/success?school=${schoolId}`}
        className="mt-6 inline-block rounded-xl bg-gray-100 px-7 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200">
        Actualiser
      </Link>
    </div>
  )
}
