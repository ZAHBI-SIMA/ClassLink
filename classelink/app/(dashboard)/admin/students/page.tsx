import { getStudents, getClasses } from '@/actions/admin'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { getInitials } from '@/lib/utils'
import Link from 'next/link'

export const metadata = { title: 'Élèves' }

interface Props {
  searchParams: Promise<{ q?: string; classId?: string }>
}

export default async function StudentsPage({ searchParams }: Props) {
  const params = await searchParams
  const [students, classes] = await Promise.all([
    getStudents(params.q, params.classId),
    getClasses(),
  ])

  return (
    <div>
      <PageHeader
        title="Élèves"
        description={`${students.length} élève${students.length !== 1 ? 's' : ''} trouvé${students.length !== 1 ? 's' : ''}`}
        action={
          <Link
            href="/admin/students/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm
                       font-medium rounded-lg transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Inscrire un élève
          </Link>
        }
      />

      {/* Filtres */}
      <form className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Rechercher un élève..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          name="classId"
          defaultValue={params.classId ?? ''}
          className="px-3 py-2.5 text-sm rounded-lg border border-gray-300
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Toutes les classes</option>
          {classes.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm
                     font-medium rounded-lg transition"
        >
          Filtrer
        </button>
      </form>

      {students.length === 0 ? (
        <EmptyState
          title="Aucun élève trouvé"
          description={params.q
            ? 'Aucun résultat pour cette recherche.'
            : 'Inscrivez votre premier élève.'}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          action={
            <Link
              href="/admin/students/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
            >
              Inscrire un élève
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Élève</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 hidden md:table-cell">N° élève</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 hidden lg:table-cell">Classe</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center
                                      text-green-700 text-xs font-semibold flex-shrink-0">
                        {getInitials(s.first_name, s.last_name)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{s.first_name} {s.last_name}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden md:table-cell">
                    {s.student_id}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {s.class_name ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                                       font-medium bg-blue-50 text-blue-700">
                        {s.class_name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Non affecté</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
