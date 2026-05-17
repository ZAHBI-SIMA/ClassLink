import { getStudentPayments } from '@/actions/student'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS: Record<string, { label: string; color: string }> = {
  PENDING:  { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  SUCCESS:  { label: 'Payé',       color: 'bg-green-100 text-green-700' },
  FAILED:   { label: 'Échoué',     color: 'bg-red-100 text-red-700' },
  REFUNDED: { label: 'Remboursé',  color: 'bg-gray-100 text-gray-600' },
}

export default async function StudentPaymentsPage() {
  const payments = await getStudentPayments()
  const pending = payments.filter((p: any) => p.status === 'PENDING')
  const paid    = payments.filter((p: any) => p.status === 'SUCCESS')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes paiements</h1>
        <p className="text-sm text-gray-500 mt-1">Historique de vos frais scolaires.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total payé</p>
          <p className="text-2xl font-bold text-green-700 mt-1">
            {formatCurrency(paid.reduce((s: number, p: any) => s + p.amount, 0))}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{paid.length} paiement{paid.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={`border rounded-xl p-4 ${pending.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
          <p className="text-xs text-gray-500">En attente</p>
          <p className={`text-2xl font-bold mt-1 ${pending.length > 0 ? 'text-yellow-700' : 'text-gray-400'}`}>
            {pending.length > 0 ? formatCurrency(pending.reduce((s: number, p: any) => s + p.amount, 0)) : 'À jour'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{pending.length} en attente</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {payments.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">Aucun paiement enregistré.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Frais</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Montant</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Échéance</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Payé le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.fee_name}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS[p.status]?.color ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS[p.status]?.label ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">
                    {p.due_date ? formatDate(p.due_date) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">
                    {p.paid_at ? formatDate(p.paid_at) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
