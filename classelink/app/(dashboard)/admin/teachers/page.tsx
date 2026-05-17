import { getTeachers, createTeacher } from '@/actions/admin'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { getInitials } from '@/lib/utils'

export const metadata = { title: 'Enseignants' }

export default async function TeachersPage() {
  const teachers = await getTeachers()

  return (
    <div>
      <PageHeader
        title="Enseignants"
        description={`${teachers.length} enseignant${teachers.length !== 1 ? 's' : ''} dans l'établissement`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Ajouter un enseignant</h3>
            <form action={createTeacher} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Prénom</label>
                  <input
                    name="firstName"
                    required
                    placeholder="Jean"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    name="lastName"
                    required
                    placeholder="Kouassi"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="jean.kouassi@ecole.ci"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="+225 07 00 00 00 00"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Spécialité</label>
                <input
                  name="specialty"
                  placeholder="Mathématiques"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">N° matricule</label>
                <input
                  name="employeeId"
                  placeholder="EMP-001"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-400">
                Un mot de passe temporaire sera généré et envoyé à l&apos;enseignant.
              </p>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm
                           font-medium rounded-lg transition"
              >
                Ajouter l&apos;enseignant
              </button>
            </form>
          </div>
        </div>

        {/* Liste */}
        <div className="lg:col-span-2">
          {teachers.length === 0 ? (
            <EmptyState
              title="Aucun enseignant"
              description="Ajoutez votre premier enseignant."
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Enseignant</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 hidden md:table-cell">Spécialité</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 hidden lg:table-cell">Classes</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teachers.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center
                                          text-blue-700 text-xs font-semibold flex-shrink-0">
                            {getInitials(t.first_name, t.last_name)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{t.first_name} {t.last_name}</p>
                            <p className="text-xs text-gray-400">{t.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        {t.specialty ?? '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                                         font-medium bg-blue-50 text-blue-700">
                          {t.class_count} classe{t.class_count !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                          ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {t.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
