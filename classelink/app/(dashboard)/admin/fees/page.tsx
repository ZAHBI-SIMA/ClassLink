import { getFeeTypes, createFeeType } from '@/actions/admin'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ExportExcelButton } from '@/components/ui/export-excel-button'

export const metadata = { title: 'Frais scolaires' }

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount)
}

export default async function FeesPage() {
  const feeTypes = await getFeeTypes()
  const totalExpected = feeTypes.reduce((sum: number, f: any) => sum + f.amount, 0)
  const totalCollected = feeTypes.reduce((sum: number, f: any) => sum + (f.total_collected ?? 0), 0)

  return (
    <div>
      <PageHeader
        title="Frais scolaires"
        description="Configurez les types de frais et suivez la collecte."
        action={
          <ExportExcelButton
            rows={feeTypes.map((f: any) => ({
              'Intitulé': f.name,
              'Montant (FCFA)': f.amount,
              'Optionnel': f.is_optional ? 'Oui' : 'Non',
              'Paiements': f.payments_count,
              'Total collecté (FCFA)': f.total_collected ?? 0,
            }))}
            filename="frais-scolaires.xlsx"
            sheetName="Frais"
          />
        }
      />

      {/* Résumé financier */}
      {feeTypes.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium">Total des frais définis</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatFCFA(totalExpected)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium">Total collecté</p>
            <p className="text-xl font-bold text-green-600 mt-1">{formatFCFA(totalCollected)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Nouveau type de frais</h3>
            <form action={createFeeType as any} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Intitulé</label>
                <input
                  name="name"
                  required
                  placeholder="Frais de scolarité"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                <input
                  name="amount"
                  type="number"
                  required
                  min={0}
                  placeholder="150000"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="isOptional"
                  name="isOptional"
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="isOptional" className="text-sm text-gray-700">Frais optionnels</label>
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm
                           font-medium rounded-lg transition"
              >
                Créer le type de frais
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          {feeTypes.length === 0 ? (
            <EmptyState
              title="Aucun type de frais"
              description="Créez les types de frais scolaires (inscription, scolarité, cantine...)"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
          ) : (
            <div className="space-y-3">
              {feeTypes.map((fee: any) => (
                <div key={fee.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900">{fee.name}</h4>
                      {fee.is_optional && (
                        <span className="text-xs text-gray-400 px-1.5 py-0.5 rounded bg-gray-100">
                          Optionnel
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fee.payments_count} paiement{fee.payments_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{formatFCFA(fee.amount)}</p>
                    {fee.total_collected > 0 && (
                      <p className="text-xs text-green-600 mt-0.5">{formatFCFA(fee.total_collected)} collectés</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
