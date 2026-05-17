import { getParentChildren } from '@/actions/parent'
import Link from 'next/link'

export default async function ParentChildrenPage() {
  const children = await getParentChildren()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes enfants</h1>
        <p className="text-sm text-gray-500 mt-1">
          {children.length === 0
            ? 'Aucun enfant associé à votre compte.'
            : `${children.length} élève${children.length > 1 ? 's' : ''} suivi${children.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {children.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-20 text-center">
          <p className="text-gray-400 text-sm">
            Contactez l&apos;administration pour associer vos enfants à votre compte.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {children.map((child: any) => (
            <Link
              key={child.id}
              href={`/parent/children/${child.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-sm transition group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center
                                text-purple-700 font-bold text-lg flex-shrink-0">
                  {child.first_name[0]}{child.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900 group-hover:text-purple-700 transition truncate">
                    {child.first_name} {child.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {child.class_name ?? 'Classe non assignée'}
                    {child.year_name ? ` · ${child.year_name}` : ''}
                  </p>
                </div>
                {child.relation && (
                  <span className="text-xs bg-purple-50 text-purple-600 font-medium px-2 py-0.5 rounded-full border border-purple-200 flex-shrink-0">
                    {child.relation}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>N° {child.student_number ?? '—'}</span>
                <span className="text-purple-600 font-medium group-hover:underline">
                  Voir le détail →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
