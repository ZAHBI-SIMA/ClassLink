import { getSanctions, getStudentsForSanction, deleteSanction } from '@/actions/admin'
import { PageHeader } from '@/components/ui/page-header'
import { CreateSanctionForm } from './create-form'

interface Props {
  searchParams: Promise<{ q?: string }>
}

const TYPE_COLORS: Record<string, string> = {
  AVERTISSEMENT:  'bg-yellow-100 text-yellow-800',
  BLAME:          'bg-orange-100 text-orange-800',
  EXCLUSION_TEMP: 'bg-red-100 text-red-700',
  RENVOI:         'bg-red-900 text-white',
  AUTRE:          'bg-gray-100 text-gray-700',
}

const TYPE_LABELS: Record<string, string> = {
  AVERTISSEMENT:  'Avertissement',
  BLAME:          'Blâme',
  EXCLUSION_TEMP: 'Exclusion temporaire',
  RENVOI:         'Renvoi',
  AUTRE:          'Autre',
}

export default async function SanctionsPage({ searchParams }: Props) {
  const { q } = await searchParams
  const [sanctions, students] = await Promise.all([
    getSanctions(q),
    getStudentsForSanction(),
  ])

  return (
    <div>
      <PageHeader
        title="Sanctions & Punitions"
        description="Gérer les sanctions des élèves"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de création */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Nouvelle sanction</h3>
            <CreateSanctionForm students={students} />
          </div>
        </div>

        {/* Liste des sanctions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                Liste des sanctions{' '}
                <span className="text-gray-400 font-normal">({sanctions.length})</span>
              </h3>
              <form method="GET">
                <input
                  name="q"
                  defaultValue={q ?? ''}
                  placeholder="Rechercher un élève…"
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </form>
            </div>

            {sanctions.length === 0 ? (
              <p className="text-sm text-gray-400 italic text-center py-12">
                Aucune sanction enregistrée.
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {sanctions.map((s: any) => (
                  <div key={s.id} className="px-5 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {s.last_name} {s.first_name}
                        </span>
                        {s.class_name && (
                          <span className="text-xs text-gray-400">· {s.class_name}</span>
                        )}
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[s.type] ?? 'bg-gray-100 text-gray-700'}`}>
                          {TYPE_LABELS[s.type] ?? s.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 truncate">{s.reason}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>{new Date(s.date).toLocaleDateString('fr-FR')}</span>
                        {s.duration && <span>· {s.duration} jour(s)</span>}
                        <span>· Par {s.issued_first} {s.issued_last}</span>
                      </div>
                    </div>
                    <form
                      action={async () => {
                        'use server'
                        await deleteSanction(s.id)
                      }}
                    >
                      <button
                        type="submit"
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition flex-shrink-0"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
