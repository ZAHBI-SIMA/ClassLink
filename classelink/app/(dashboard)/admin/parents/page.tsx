import { getParents } from '@/actions/admin'
import { ParentCreateForm } from './create-form'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ExportExcelButton } from '@/components/ui/export-excel-button'
import { getInitials } from '@/lib/utils'
import Link from 'next/link'

export const metadata = { title: 'Parents' }

export default async function ParentsPage() {
  const parents = await getParents()

  return (
    <div>
      <PageHeader
        title="Parents & Tuteurs"
        description={`${parents.length} parent${parents.length !== 1 ? 's' : ''} enregistré${parents.length !== 1 ? 's' : ''}`}
        action={
          <ExportExcelButton
            rows={parents.map((p: any) => ({
              'Prénom': p.first_name,
              'Nom': p.last_name,
              'Email': p.email,
              'Téléphone': p.phone ?? '',
              "Nombre d'enfants": p.children_count,
            }))}
            filename="parents.xlsx"
            sheetName="Parents"
          />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ParentCreateForm />
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
                    <th className="px-4 py-3"></th>
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
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/parents/${p.id}`}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                          Détails →
                        </Link>
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
