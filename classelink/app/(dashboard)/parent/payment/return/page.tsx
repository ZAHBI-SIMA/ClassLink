import Link from 'next/link'
import { getChildDetails } from '@/actions/parent'

interface Props {
  searchParams: Promise<{ paymentId?: string; studentId?: string }>
}

export const metadata = { title: 'Résultat du paiement' }

export default async function PaymentReturnPage({ searchParams }: Props) {
  const { paymentId, studentId } = await searchParams

  // Récupérer le statut réel du paiement (le webhook aura peut-être déjà mis à jour)
  let paymentStatus: string | null = null
  let feeName: string | null = null
  let amount: number | null = null

  if (studentId) {
    try {
      const data = await getChildDetails(studentId)
      if (data) {
        const p = data.payments.find((x: any) => x.id === paymentId)
        if (p) {
          paymentStatus = p.status
          feeName = p.fee_name
          amount = p.amount
        }
      }
    } catch {
      // ignore
    }
  }

  const isSuccess = paymentStatus === 'SUCCESS'
  const isPending = paymentStatus === 'PENDING' || paymentStatus === null
  const backHref = studentId ? `/parent/children/${studentId}` : '/parent'

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center space-y-6">
        {/* Icône */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto
          ${isSuccess ? 'bg-green-100' : isPending ? 'bg-yellow-100' : 'bg-red-100'}`}>
          {isSuccess ? (
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : isPending ? (
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        {/* Message */}
        <div>
          <h1 className={`text-2xl font-bold ${isSuccess ? 'text-green-700' : isPending ? 'text-yellow-700' : 'text-red-700'}`}>
            {isSuccess ? 'Paiement confirmé !' : isPending ? 'Paiement en cours…' : 'Paiement échoué'}
          </h1>
          {feeName && amount !== null && (
            <p className="mt-2 text-sm text-gray-600">
              {feeName} — {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount)}
            </p>
          )}
          <p className="mt-3 text-sm text-gray-500">
            {isSuccess
              ? 'Le paiement a été enregistré avec succès. Vous recevrez un reçu par email.'
              : isPending
              ? 'Le paiement est en cours de traitement. La page se mettra à jour automatiquement.'
              : 'Le paiement n\'a pas abouti. Veuillez réessayer ou contacter l\'administration.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={backHref}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition"
          >
            Retour au profil
          </Link>
          {isPending && (
            <Link
              href={`/parent/payment/return?paymentId=${paymentId}&studentId=${studentId}`}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition"
            >
              Actualiser
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
