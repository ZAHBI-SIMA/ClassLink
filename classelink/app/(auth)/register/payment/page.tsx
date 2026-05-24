import type { Metadata } from 'next'
import Link from 'next/link'
import { getRegistrationInfo } from '@/actions/register'
import { PayButton } from './pay-button'

export const metadata: Metadata = { title: 'Paiement de l’abonnement' }
export const runtime = 'nodejs'

interface Props {
  searchParams: Promise<{ school?: string }>
}

function formatXof(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}

export default async function RegisterPaymentPage({ searchParams }: Props) {
  const { school: schoolId } = await searchParams

  if (!schoolId) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-600">Établissement non spécifié.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-blue-600">Accueil</Link>
      </div>
    )
  }

  const info = await getRegistrationInfo(schoolId)
  if (!info) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-600">Établissement introuvable.</p>
        <Link href="/" className="mt-3 inline-block text-sm font-medium text-blue-600">Accueil</Link>
      </div>
    )
  }

  if (info.status === 'ACTIVE') {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900">Abonnement déjà actif</h2>
        <p className="mt-1 text-sm text-gray-500">Votre établissement est prêt.</p>
        <Link href="/login" className="mt-5 inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          Se connecter
        </Link>
      </div>
    )
  }

  const isFree = info.amount <= 0

  return (
    <div>
      <div className="mb-5 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Finaliser votre inscription</h2>
        <p className="mt-1 text-sm text-gray-500">{info.schoolName}</p>
      </div>

      {/* Récapitulatif */}
      <div className="rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Forfait {info.planName}</span>
          <span className="text-sm font-semibold text-gray-900">
            {isFree ? 'Gratuit' : `${formatXof(info.amount)} FCFA`}
          </span>
        </div>
        {!isFree && (
          <p className="mt-1 text-xs text-gray-400">Facturation mensuelle · paiement sécurisé via GeniusPay</p>
        )}
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-sm font-medium text-gray-900">Total à payer</span>
          <span className="text-lg font-extrabold text-blue-600">
            {isFree ? '0 FCFA' : `${formatXof(info.amount)} FCFA`}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <PayButton schoolId={schoolId} isFree={isFree} />
      </div>

      <p className="mt-4 text-center text-xs text-gray-400">
        En continuant, vous serez redirigé vers la page de paiement GeniusPay
        (Wave, Orange Money, MTN, carte…).
      </p>
    </div>
  )
}
