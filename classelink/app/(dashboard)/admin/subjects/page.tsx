import { getSubjects, createSubject, getLevels, createLevel } from '@/actions/admin'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'

export const metadata = { title: 'Matières' }

export default async function SubjectsPage() {
  const [subjects, levels] = await Promise.all([getSubjects(), getLevels()])

  return (
    <div>
      <PageHeader
        title="Matières & Niveaux"
        description="Configurez les matières enseignées et les niveaux de votre établissement."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Niveaux */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Niveaux</h3>
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <form action={createLevel} className="flex gap-2">
              <input
                name="name"
                required
                placeholder="Ex : 6ème, 5ème, Terminale..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="order"
                type="number"
                placeholder="Ordre"
                defaultValue={levels.length + 1}
                className="w-20 px-3 py-2 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm
                           font-medium rounded-lg transition flex-shrink-0"
              >
                Ajouter
              </button>
            </form>
          </div>

          {levels.length === 0 ? (
            <EmptyState
              title="Aucun niveau"
              description="Ajoutez les niveaux (6ème, 5ème, 4ème...)"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              }
            />
          ) : (
            <div className="space-y-2">
              {levels.map((level: any) => (
                <div key={level.id}
                  className="flex items-center justify-between bg-white rounded-lg border
                             border-gray-200 px-4 py-3">
                  <span className="text-sm font-medium text-gray-900">{level.name}</span>
                  <span className="text-xs text-gray-400">Ordre {level.level_order}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Matières */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Matières</h3>
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <form action={createSubject} className="flex gap-2">
              <input
                name="name"
                required
                placeholder="Nom de la matière"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="code"
                required
                placeholder="Code (MATH)"
                className="w-24 px-3 py-2 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm
                           font-medium rounded-lg transition flex-shrink-0"
              >
                Ajouter
              </button>
            </form>
          </div>

          {subjects.length === 0 ? (
            <EmptyState
              title="Aucune matière"
              description="Ajoutez les matières enseignées dans votre établissement."
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
            />
          ) : (
            <div className="space-y-2">
              {subjects.map((s: any) => (
                <div key={s.id}
                  className="flex items-center justify-between bg-white rounded-lg border
                             border-gray-200 px-4 py-3">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{s.name}</span>
                    <span className="ml-2 text-xs text-gray-400 font-mono">{s.code}</span>
                  </div>
                  {s.level_assignments && (
                    <span className="text-xs text-gray-400">
                      {s.level_assignments.length} niveau{s.level_assignments.length !== 1 ? 'x' : ''}
                    </span>
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
