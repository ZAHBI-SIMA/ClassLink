import { getClasses, createClass, getLevels, getAcademicYears } from '@/actions/admin'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'

export const metadata = { title: 'Classes' }

export default async function ClassesPage() {
  const [classes, levels, years] = await Promise.all([
    getClasses(),
    getLevels(),
    getAcademicYears(),
  ])

  const currentYear = years.find((y: any) => y.is_current) ?? years[0]

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Gérez les classes de votre établissement."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Nouvelle classe</h3>
            <form action={createClass} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nom (ex : 6ème A)</label>
                <input
                  name="name"
                  required
                  placeholder="6ème A"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Niveau</label>
                <select
                  name="levelId"
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Sélectionner —</option>
                  {levels.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Année scolaire</label>
                <select
                  name="academicYearId"
                  required
                  defaultValue={currentYear?.id ?? ''}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Sélectionner —</option>
                  {years.map((y: any) => (
                    <option key={y.id} value={y.id}>
                      {y.name}{y.is_current ? ' (actuelle)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Effectif max</label>
                <input
                  name="maxStudents"
                  type="number"
                  defaultValue={40}
                  min={1}
                  max={200}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Salle (optionnel)</label>
                <input
                  name="room"
                  placeholder="Salle 12"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {levels.length === 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                  Vous devez d&apos;abord créer des niveaux dans{' '}
                  <Link href="/admin/subjects" className="underline">Matières</Link>.
                </p>
              )}

              <button
                type="submit"
                disabled={levels.length === 0}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                           text-white text-sm font-medium rounded-lg transition"
              >
                Créer la classe
              </button>
            </form>
          </div>
        </div>

        {/* Grille des classes */}
        <div className="lg:col-span-2">
          {classes.length === 0 ? (
            <EmptyState
              title="Aucune classe"
              description="Créez votre première classe pour organiser les élèves."
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {classes.map((cls: any) => {
                const fillPercent = Math.round((cls.student_count / cls.max_students) * 100)
                const fillColor = fillPercent >= 90 ? 'bg-red-500' : fillPercent >= 70 ? 'bg-orange-400' : 'bg-blue-500'

                return (
                  <div key={cls.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{cls.name}</h4>
                        <p className="text-xs text-gray-500">{cls.level_name}{cls.stream_name ? ` · ${cls.stream_name}` : ''}</p>
                      </div>
                      <span className="text-xs text-gray-400">{cls.year_name}</span>
                    </div>

                    {/* Barre d'effectif */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>{cls.student_count} élèves</span>
                        <span>/{cls.max_students}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${fillColor}`}
                          style={{ width: `${Math.min(fillPercent, 100)}%` }}
                        />
                      </div>
                    </div>

                    {cls.head_teacher_name && (
                      <p className="text-xs text-gray-400 mt-2">
                        Titulaire : {cls.head_teacher_name}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
