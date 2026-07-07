import { getPublicPaymentDetails } from '@/actions/public-payment'
import { PayNowButton } from './pay-now-button'

interface Props {
  params: Promise<{ token: string }>
}

export const metadata = { title: 'Paiement Mobile Money — MyClassLink' }

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n)

export default async function PublicPaymentPage({ params }: Props) {
  const { token } = await params
  const result = await getPublicPaymentDetails(token)

  if (!result.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900">Lien invalide</h1>
          <p className="text-sm text-gray-500">{result.error}</p>
        </div>
      </div>
    )
  }

  const { feeName, studentName, schoolName, amount, status } = result.data!
  const isAlreadyPaid = status === 'SUCCESS'

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 w-full max-w-sm overflow-hidden">

        {/* En-tête */}
        <div className="bg-blue-600 px-6 py-6 text-white text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest">MyClassLink</p>
          <h1 className="text-xl font-bold mt-1">{schoolName}</h1>
        </div>

        {/* Détails du paiement */}
        <div className="px-6 py-6 space-y-5">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Élève</span>
              <span className="font-semibold text-gray-900">{studentName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Type de frais</span>
              <span className="font-medium text-gray-700">{feeName}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
              <span className="text-gray-500">Montant à payer</span>
              <span className="text-2xl font-extrabold text-blue-700">{fmt(amount)}</span>
            </div>
          </div>

          {isAlreadyPaid ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-green-700">Paiement déjà effectué</p>
                <p className="text-xs text-green-600 mt-0.5">Ce paiement a été confirmé avec succès.</p>
              </div>
            </div>
          ) : (
            <PayNowButton token={token} amount={amount} />
          )}
        </div>

        <p className="text-center text-xs text-gray-400 pb-5">
          Paiement sécurisé · Propulsé par <span className="font-medium">MyClassLink &amp; GeniusPay</span>
        </p>
      </div>
    </div>
  )
}
