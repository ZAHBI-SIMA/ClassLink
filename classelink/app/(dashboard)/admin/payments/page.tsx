import { getPayments, getPaymentStats, getStudentsForPayment, getFeeTypes } from '@/actions/admin'
import { PaymentCreateForm } from './create-form'
import { MarkPaidButton } from './mark-paid-button'
import { PaymentLinkButton } from './payment-link-button'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ status?: string; search?: string }>
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:  { label: 'En attente',  color: 'bg-yellow-100 text-yellow-700' },
  SUCCESS:  { label: 'Payé',        color: 'bg-green-100 text-green-700' },
  FAILED:   { label: 'Échoué',      color: 'bg-red-100 text-red-700' },
  REFUNDED: { label: 'Remboursé',   color: 'bg-gray-100 text-gray-600' },
}

export default async function PaymentsPage({ searchParams }: Props) {
  const params = await searchParams
  const selectedStatus = params.status ?? ''
  const search         = params.search ?? ''

  const [payments, stats, students, feeTypes] = await Promise.all([
    getPayments(search, selectedStatus),
    getPaymentStats(),
    getStudentsForPayment(),
    getFeeTypes(),
  ])

  const collectionRate = stats.total_amount > 0
    ? Math.round((stats.paid_amount / stats.total_amount) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
        <p className="text-sm text-gray-500 mt-1">Suivi des frais scolaires et paiements.</p>
      </div>

      {/* KPIs financiers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total attendu',  value: formatCurrency(stats.total_amount),   color: 'text-gray-700' },
          { label: 'Collecté',       value: formatCurrency(stats.paid_amount),     color: 'text-green-700' },
          { label: 'En attente',     value: formatCurrency(stats.pending_amount),  color: 'text-yellow-700' },
          { label: 'Taux collecte',  value: `${collectionRate}%`,                 color: collectionRate >= 80 ? 'text-green-700' : 'text-orange-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium">{k.label}</p>
            <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div>
          <PaymentCreateForm students={students} feeTypes={feeTypes} />
        </div>

        {/* Liste */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Tous', value: '' },
              { label: 'En attente', value: 'PENDING' },
              { label: 'Payés', value: 'SUCCESS' },
              { label: 'Échoués', value: 'FAILED' },
            ].map(f => (
              <Link
                key={f.value}
                href={`/admin/payments?status=${f.value}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  selectedStatus === f.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {f.label}
              </Link>
            ))}
            <div className="ml-auto">
              <span className="text-xs text-gray-400">
                {payments.length} paiement{payments.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {payments.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                Aucun paiement{selectedStatus ? ' avec ce statut' : ''}.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Élève</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Frais</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Montant</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Échéance</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {p.last_name} {p.first_name}
                        </p>
                        <p className="text-xs text-gray-400">{p.student_number}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        {p.fee_name}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold
                          ${STATUS_LABELS[p.status]?.color ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[p.status]?.label ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">
                        {p.due_date ? formatDate(p.due_date) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.status === 'PENDING' && (
                          <div className="flex flex-col items-end gap-1.5">
                            <PaymentLinkButton paymentId={p.id} />
                            <MarkPaidButton paymentId={p.id} />
                          </div>
                        )}
                        {p.status === 'SUCCESS' && p.paid_at && (
                          <span className="text-xs text-gray-400">
                            {formatDate(p.paid_at)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
