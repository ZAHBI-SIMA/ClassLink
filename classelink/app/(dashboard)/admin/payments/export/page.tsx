import { getPaymentsForExport } from '@/actions/admin'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  PENDING:  'En attente',
  SUCCESS:  'Payé',
  FAILED:   'Échoué',
  REFUNDED: 'Remboursé',
}

export default async function PaymentsExportPage() {
  const payments = await getPaymentsForExport()

  return (
    <div>
      <PageHeader
        title="Export des paiements"
        description="Prévisualisation et téléchargement de tous les paiements"
        action={
          <a
            href="/api/admin/payments/export"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Télécharger CSV
          </a>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/admin/payments"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Retour aux paiements
        </Link>
        <span className="text-sm text-gray-400">{payments.length} paiement(s)</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">N° Élève</th>
                <th className="text-left px-4 py-3">Nom</th>
                <th className="text-left px-4 py-3">Prénom</th>
                <th className="text-left px-4 py-3">Classe</th>
                <th className="text-left px-4 py-3">Type de frais</th>
                <th className="text-right px-4 py-3">Montant</th>
                <th className="text-center px-4 py-3">Statut</th>
                <th className="text-left px-4 py-3">Date échéance</th>
                <th className="text-left px-4 py-3">Date paiement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400 italic text-sm">
                    Aucun paiement trouvé.
                  </td>
                </tr>
              ) : (
                payments.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{p.student_number}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{p.last_name}</td>
                    <td className="px-4 py-2.5 text-gray-700">{p.first_name}</td>
                    <td className="px-4 py-2.5 text-gray-600">{p.class_name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-700">{p.fee_name}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-900">
                      {Number(p.amount).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        p.status === 'SUCCESS'
                          ? 'bg-green-100 text-green-800'
                          : p.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">
                      {p.due_date ? new Date(p.due_date).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
