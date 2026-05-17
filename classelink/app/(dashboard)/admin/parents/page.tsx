import { getParents, createParent } from '@/actions/admin'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { getInitials } from '@/lib/utils'

export const metadata = { title: 'Parents' }

export default async function ParentsPage() {
  const parents = await getParents()

  return (
    <div>
      <PageHeader
        title="Parents & Tuteurs"
        description={`${parents.length} parent${parents.length !== 1 ? 's' : ''} enregistré${parents.length !== 1 ? 's' : ''}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Ajouter un parent</h3>
            <form action={createParent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Prénom</label>
                  <input name="firstName" required placeholder="Marie"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                               focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
                  <input name="lastName" required placeholder="Ouattara"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                               focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input name="email" type="email" required placeholder="marie.ouattara@gmail.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                <input name="phone" type="tel" placeholder="+225 07 00 00 00 00"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                             focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <p className="text-xs text-gray-400">
                Un mot de passe temporaire sera généré automatiquement.
              </p>
              <button type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm
                           font-medium rounded-lg transition">
                Ajouter le parent
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          {parents.length === 0 ? (
            <EmptyState
              title="Aucun parent enregistré"
              description="Ajoutez des parents pour les lier aux élèves."
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              }
            />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Parent</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 hidden md:table-cell">Téléphone</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Enfants</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parents.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center
                                          text-purple-700 text-xs font-semibold flex-shrink-0">
                            {getInitials(p.first_name, p.last_name)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{p.first_name} {p.last_name}</p>
                            <p className="text-xs text-gray-400">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        {p.phone ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                                         font-medium bg-blue-50 text-blue-700">
                          {p.children_count} enfant{p.children_count !== 1 ? 's' : ''}
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
