import { getParentPayments, getPaymentAvailability } from '@/actions/parent'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PayOnlineButton } from '../children/[studentId]/pay-button'

export const runtime = 'nodejs'

const STATUS: Record<string, { label: string; color: string }> = {
  PENDING:  { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  SUCCESS:  { label: 'Payé',       color: 'bg-green-100 text-green-700' },
  FAILED:   { label: 'Échoué',     color: 'bg-red-100 text-red-700' },
  REFUNDED: { label: 'Remboursé',  color: 'bg-gray-100 text-gray-600' },
}

function childName(p: any) {
  return `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
}

export default async function ParentPaymentsPage() {
  const [payments, paymentAvailable] = await Promise.all([
    getParentPayments(),
    getPaymentAvailability(),
  ])

  const pending = payments.filter((p: any) => p.status === 'PENDING')
  const paid    = payments.filter((p: any) => p.status === 'SUCCESS')

  const totalPaid    = paid.reduce((s: number, p: any) => s + Number(p.amount), 0)
  const totalPending = pending.reduce((s: number, p: any) => s + Number(p.amount), 0)
  const childrenCount = new Set(pending.map((p: any) => p.student_id)).size

  const today = new Date()
  const isOverdue = (p: any) => p.due_date && new Date(p.due_date) < today

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Frais scolaires</h1>
        <p className="text-sm text-gray-500 mt-1">
          Réglez les frais de scolarité de vos enfants et consultez l’historique détaillé de vos paiements.
        </p>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total payé</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{paid.length} paiement{paid.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={`border rounded-xl p-4 ${pending.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
          <p className="text-xs text-gray-500">Reste à payer</p>
          <p className={`text-2xl font-bold mt-1 ${pending.length > 0 ? 'text-yellow-700' : 'text-gray-400'}`}>
            {pending.length > 0 ? formatCurrency(totalPending) : 'À jour'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{pending.length} frais en attente</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Enfants concernés</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{childrenCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">avec des frais en attente</p>
        </div>
      </div>

      {/* À régler */}
      {pending.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <h2 className="text-sm font-semibold text-gray-900">Frais à régler</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {pending.map((p: any) => (
              <li key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{p.fee_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {childName(p)}{p.class_name ? ` · ${p.class_name}` : ''}
                  </p>
                  {p.due_date && (
                    <p className={`text-xs mt-0.5 ${isOverdue(p) ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                      {isOverdue(p) ? 'En retard — échéance ' : 'Échéance '}{formatDate(p.due_date)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-base font-bold text-gray-900">{formatCurrency(p.amount)}</span>
                  <PayOnlineButton
                    paymentId={p.id}
                    studentId={p.student_id}
                    amount={Number(p.amount)}
                    feeName={p.fee_name}
                    paymentAvailable={paymentAvailable}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Historique détaillé */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Historique détaillé</h2>
        </div>
        {payments.length === 0 ? (
          <p className="px-5 py-12 text-sm text-gray-400 text-center">Aucun paiement enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Enfant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Frais</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Montant</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Méthode</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Référence</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Échéance</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Payé le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{childName(p)}</span>
                      {p.class_name && <span className="block text-xs text-gray-400">{p.class_name}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.fee_name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS[p.status]?.color ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS[p.status]?.label ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.provider ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden lg:table-cell">{p.provider_ref ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">{p.due_date ? formatDate(p.due_date) : '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{p.paid_at ? formatDate(p.paid_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
