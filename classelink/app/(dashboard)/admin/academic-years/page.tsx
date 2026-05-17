import { getAcademicYears, createAcademicYear, setCurrentYear } from '@/actions/admin'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Années scolaires' }

export default async function AcademicYearsPage() {
  const years = await getAcademicYears()

  return (
    <div>
      <PageHeader
        title="Années scolaires"
        description="Gérez les années scolaires et les trimestres de votre établissement."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de création */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Nouvelle année scolaire</h3>
            <form action={createAcademicYear as any} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nom (ex : 2024-2025)
                </label>
                <input
                  name="name"
                  required
                  placeholder="2025-2026"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date de début</label>
                <input
                  name="startDate"
                  type="date"
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date de fin</label>
                <input
                  name="endDate"
                  type="date"
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="isCurrent"
                  name="isCurrent"
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="isCurrent" className="text-sm text-gray-700">
                  Définir comme année courante
                </label>
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm
                           font-medium rounded-lg transition"
              >
                Créer l&apos;année scolaire
              </button>
            </form>
          </div>
        </div>

        {/* Liste des années */}
        <div className="lg:col-span-2">
          {years.length === 0 ? (
            <EmptyState
              title="Aucune année scolaire"
              description="Créez votre première année scolaire pour commencer."
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
          ) : (
            <div className="space-y-3">
              {years.map((year: any) => (
                <div key={year.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900">{year.name}</h4>
                      {year.is_current && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                                         font-medium bg-green-100 text-green-700">
                          En cours
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(year.start_date)} → {formatDate(year.end_date)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {year.terms_count} trimestre{year.terms_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {!year.is_current && (
                    <form action={setCurrentYear.bind(null, year.id)}>
                      <button
                        type="submit"
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5
                                   rounded-lg border border-blue-200 hover:bg-blue-50 transition"
                      >
                        Définir active
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
