import { getPaymentReceipt } from '@/actions/admin'
import { PrintButton } from '@/components/ui/print-button'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:  'En attente',
  SUCCESS:  'Payé',
  FAILED:   'Échoué',
  REFUNDED: 'Remboursé',
}

export default async function PaymentReceiptPage({ params }: Props) {
  const { id } = await params
  const p = await getPaymentReceipt(id)
  if (!p) notFound()

  const shortId = id.slice(-8).toUpperCase()

  return (
    <>
      {/* Barre d'actions — masquée à l'impression */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/admin/payments" className="hover:text-blue-600">Paiements</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Reçu #{shortId}</span>
        </div>
        <div className="flex gap-3">
          <PrintButton label="Imprimer le reçu" />
          <Link
            href="/admin/payments"
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            Retour
          </Link>
        </div>
      </div>

      {/* Zone imprimable */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl mx-auto
                      print:border-0 print:rounded-none print:p-0 print:max-w-none print:mx-0">

        {/* En-tête école */}
        <div className="flex items-start justify-between border-b-2 border-gray-800 pb-4 mb-6">
          <div>
            <p className="text-xl font-bold text-gray-900 uppercase tracking-wide">
              {p.school_name ?? 'Établissement'}
            </p>
            {p.school_address && <p className="text-xs text-gray-500 mt-0.5">{p.school_address}</p>}
            {p.school_phone   && <p className="text-xs text-gray-500">{p.school_phone}</p>}
            {p.school_email   && <p className="text-xs text-gray-500">{p.school_email}</p>}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900 uppercase">Reçu de Paiement</p>
            <p className="text-sm font-mono text-gray-600 mt-0.5">N° {shortId}</p>
            {p.paid_at && (
              <p className="text-xs text-gray-500 mt-0.5">
                Émis le {new Date(p.paid_at).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        </div>

        {/* Informations élève */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Informations de l&apos;élève</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-500 w-28 flex-shrink-0">Nom & Prénom</span>
              <span className="font-semibold text-gray-900">
                {p.last_name?.toUpperCase()} {p.first_name}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-28 flex-shrink-0">N° Élève</span>
              <span className="font-mono text-gray-900">{p.student_number ?? '—'}</span>
            </div>
            {p.class_name && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Classe</span>
                <span className="text-gray-900">{p.class_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Détail du paiement */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Détail du frais</p>
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-800 text-white text-xs uppercase">
                <th className="text-left px-4 py-2.5">Désignation</th>
                <th className="text-right px-4 py-2.5">Montant</th>
                <th className="text-center px-4 py-2.5">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 text-gray-900 font-medium">{p.fee_name}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">
                  {p.amount?.toLocaleString('fr-FR')} FCFA
                </td>
                <td className="px-4 py-3 text-center">
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
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mention légale */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6">
          <p className="text-sm text-blue-900 font-medium">
            Reçu la somme de{' '}
            <strong>{p.amount?.toLocaleString('fr-FR')} FCFA</strong>{' '}
            au titre de <em>{p.fee_name}</em>.
          </p>
          {p.due_date && (
            <p className="text-xs text-blue-700 mt-1">
              Date d&apos;échéance : {new Date(p.due_date).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>

        {/* Zone de signature */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="text-center">
            <div className="h-16 border-b border-gray-300 mb-2"></div>
            <p className="text-xs text-gray-500">Signature du caissier</p>
          </div>
          <div className="text-center">
            <div className="h-16 border-b border-gray-300 mb-2"></div>
            <p className="text-xs text-gray-500">
              {p.director_name ? `Le Directeur — ${p.director_name}` : 'Le Directeur'}
            </p>
          </div>
        </div>

        {/* Pied de page */}
        <div className="border-t border-gray-200 pt-3 text-center text-xs text-gray-400">
          Reçu généré par ClasseLink · {new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>
    </>
  )
}
