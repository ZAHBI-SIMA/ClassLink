import { getSchools, getPlans } from '@/actions/super-admin'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ page?: string; search?: string; status?: string; planId?: string }>
}

export default async function SchoolsPage({ searchParams }: Props) {
  const params = await searchParams
  const [result, plans] = await Promise.all([
    getSchools({
      page: params.page ? parseInt(params.page) : 1,
      search: params.search,
      status: params.status,
      planId: params.planId,
    }),
    getPlans(),
  ])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Établissements"
        description={`${result.total} école${result.total > 1 ? 's' : ''} enregistrée${result.total > 1 ? 's' : ''}`}
        action={
          <Link
            href="/super-admin/schools/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white
                       text-sm font-medium hover:bg-blue-700 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter une école
          </Link>
        }
      />

      {/* Filtres */}
      <form method="GET" className="flex flex-wrap gap-3">
        <input
          name="search"
          defaultValue={params.search}
          placeholder="Rechercher..."
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none
                     focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
        />
        <select
          name="status"
          defaultValue={params.status ?? ''}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none
                     focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Tous les statuts</option>
          <option value="TRIAL">Essai</option>
          <option value="ACTIVE">Actif</option>
          <option value="SUSPENDED">Suspendu</option>
          <option value="CANCELLED">Résilié</option>
        </select>
        <select
          name="planId"
          defaultValue={params.planId ?? ''}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none
                     focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Tous les plans</option>
          {plans.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition"
        >
          Filtrer
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {result.data.length === 0 ? (
          <EmptyState
            title="Aucun établissement"
            description="Aucune école ne correspond à votre recherche."
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    École
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    Plan
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                    Créée le
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Statut
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.data.map((school: any) => (
                  <tr key={school.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center
                                        text-blue-700 font-bold text-sm flex-shrink-0">
                          {school.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{school.name}</p>
                          <p className="text-xs text-gray-400">{school.adminEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-gray-600">{school.plan?.name}</span>
                    </td>
                    <td className="px-4 py-4 text-gray-500 hidden lg:table-cell">
                      {formatDate(school.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={school.status} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/super-admin/schools/${school.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-xs"
                      >
                        Détails →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {result.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {result.page} sur {result.totalPages} · {result.total} résultats
            </p>
            <div className="flex gap-2">
              {result.page > 1 && (
                <Link
                  href={`?page=${result.page - 1}${params.search ? `&search=${params.search}` : ''}${params.status ? `&status=${params.status}` : ''}`}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium hover:bg-gray-50"
                >
                  ← Précédent
                </Link>
              )}
              {result.page < result.totalPages && (
                <Link
                  href={`?page=${result.page + 1}${params.search ? `&search=${params.search}` : ''}${params.status ? `&status=${params.status}` : ''}`}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium hover:bg-gray-50"
                >
                  Suivant →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
