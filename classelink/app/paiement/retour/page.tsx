import { verifyPaymentToken } from '@/lib/payments/payment-link'
import { getTenantPrisma } from '@/lib/db/tenant'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export const metadata = { title: 'Résultat du paiement — MyClassLink' }

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n)

export default async function PublicPaymentReturnPage({ searchParams }: Props) {
  const { token } = await searchParams

  let paymentStatus: string | null = null
  let feeName:       string | null = null
  let amount:        number | null = null
  let schoolName:    string | null = null
  let validToken:    string | null = token ?? null

  if (token) {
    try {
      const payload = await verifyPaymentToken(token)
      if (payload) {
        const db = getTenantPrisma(payload.schemaName) as any
        const rows: any[] = await db.$queryRaw`
          SELECT p.status FROM payments p WHERE p.id = ${payload.paymentId} LIMIT 1
        `
        paymentStatus = rows[0]?.status ?? null
        feeName    = payload.feeName
        amount     = payload.amount
        schoolName = payload.schoolName
      }
    } catch { /* ignore */ }
  }

  const isSuccess = paymentStatus === 'SUCCESS'
  const isPending = paymentStatus === 'PENDING' || paymentStatus === null
  const isFailed  = !isSuccess && !isPending

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-10">
      <div className="max-w-sm w-full space-y-6 text-center">

        {/* Icône statut */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg
          ${isSuccess ? 'bg-green-100 shadow-green-100' : isPending ? 'bg-yellow-100 shadow-yellow-100' : 'bg-red-100 shadow-red-100'}`}>
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
          <h1 className={`text-2xl font-bold
            ${isSuccess ? 'text-green-700' : isPending ? 'text-yellow-700' : 'text-red-700'}`}>
            {isSuccess ? 'Paiement confirmé !' : isPending ? 'Paiement en cours…' : 'Paiement échoué'}
          </h1>
          {schoolName && (
            <p className="text-sm text-gray-500 mt-1">{schoolName}</p>
          )}
          {feeName && amount !== null && (
            <p className="mt-2 text-sm text-gray-600">
              {feeName} — <span className="font-semibold">{fmt(amount)}</span>
            </p>
          )}
          <p className="mt-3 text-sm text-gray-500 max-w-xs mx-auto">
            {isSuccess
              ? 'Le paiement a été enregistré avec succès. L\'administration en sera notifiée.'
              : isPending
              ? 'Le paiement est en cours de traitement. Ce statut sera mis à jour automatiquement.'
              : 'Le paiement n\'a pas abouti. Vous pouvez réessayer via le lien de paiement.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isPending && validToken && (
            <Link
              href={`/paiement/retour?token=${encodeURIComponent(validToken)}`}
              className="w-full py-3 px-6 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold rounded-xl transition"
            >
              Actualiser le statut
            </Link>
          )}
          {isFailed && validToken && (
            <Link
              href={`/paiement/${validToken}`}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition"
            >
              Réessayer le paiement
            </Link>
          )}
        </div>

        <p className="text-xs text-gray-400">Propulsé par MyClassLink &amp; GeniusPay</p>
      </div>
    </div>
  )
}
