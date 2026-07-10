import { getTermsAndClasses, getBulletinList } from '@/actions/bulletin'
import { PageHeader } from '@/components/ui/page-header'
import { ExportExcelButton } from '@/components/ui/export-excel-button'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ classId?: string; termId?: string }>
}

const DECISION_CFG: Record<string, { label: string; cls: string }> = {
  PASSAGE:             { label: 'Passage',              cls: 'bg-green-100 text-green-700 border-green-200' },
  PASSAGE_ENCOURAGED:  { label: 'Passage encouragé',   cls: 'bg-teal-100 text-teal-700 border-teal-200' },
  REDOUBLEMENT:        { label: 'Redoublement',         cls: 'bg-red-100 text-red-700 border-red-200' },
  ORIENTATION:         { label: 'Orientation',          cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  EXCLUSION:           { label: 'Exclusion',            cls: 'bg-gray-100 text-gray-600 border-gray-200' },
}

function DecisionBadge({ decision }: { decision: string | null }) {
  if (!decision) return <span className="text-gray-400 text-xs italic">—</span>
  const cfg = DECISION_CFG[decision] ?? { label: decision, cls: 'bg-gray-100 text-gray-600 border-gray-200' }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

export default async function BulletinListPage({ searchParams }: Props) {
  const sp = await searchParams
  const { classes, terms } = await getTermsAndClasses()

  const classId = sp.classId || undefined
  const termId  = sp.termId  || undefined

  const hasSelection = !!(classId && termId)
  const bulletins: any[] = hasSelection ? await getBulletinList(classId, termId) : []

  const selectedClass = classes.find((c: any) => c.id === classId)
  const selectedTerm  = terms.find((t: any)   => t.id === termId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulletins scolaires"
        description="Consultez et imprimez les bulletins de notes par classe et trimestre"
        action={
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200
                       text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </Link>
        }
      />

      {/* Filtres */}
      <form method="GET" className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Sélectionner une classe et un trimestre</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-gray-500 font-medium mb-1" htmlFor="classId">
              Classe
            </label>
            <select
              id="classId"
              name="classId"
              defaultValue={classId ?? ''}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2
                         text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les classes</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.level_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-gray-500 font-medium mb-1" htmlFor="termId">
              Trimestre
            </label>
            <select
              id="termId"
              name="termId"
              defaultValue={termId ?? ''}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2
                         text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les trimestres</option>
              {terms.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium
                       hover:bg-blue-700 transition whitespace-nowrap"
          >
            Afficher
          </button>
        </div>
      </form>

      {/* Résultats */}
      {!hasSelection ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 font-medium">Sélectionnez une classe et un trimestre</p>
          <p className="text-sm text-gray-400 mt-1">
            Choisissez un filtre ci-dessus pour afficher les bulletins correspondants.
          </p>
        </div>
      ) : bulletins.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <p className="text-gray-500 font-medium">Aucun bulletin trouvé</p>
          <p className="text-sm text-gray-400 mt-1">
            Il n&apos;y a pas encore de notes enregistrées pour cette sélection.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {selectedClass?.name ?? classId} — {selectedTerm?.name ?? termId}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{bulletins.length} élève(s)</p>
            </div>
            <ExportExcelButton
              rows={bulletins.map((b: any) => ({
                'Rang': Number(b.rank),
                'Nom': b.last_name,
                'Prénom': b.first_name,
                'Classe': b.class_name,
                'Moyenne': b.average !== null ? parseFloat(b.average) : '',
                'Décision conseil': DECISION_CFG[b.decision]?.label ?? b.decision ?? '',
              }))}
              filename={`bulletins_${selectedClass?.name ?? classId}_${selectedTerm?.name ?? termId}.xlsx`}
              sheetName="Bulletins"
            />
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Rang', 'Élève', 'Moyenne', 'Décision conseil', 'Actions'].map(h => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500
                               uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bulletins.map((b: any) => {
                const avg = b.average !== null ? parseFloat(b.average) : null
                return (
                  <tr key={b.student_id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full
                                       bg-blue-100 text-blue-700 text-xs font-bold">
                        {Number(b.rank)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {b.last_name?.toUpperCase()} {b.first_name}
                      </p>
                      <p className="text-xs text-gray-400">{b.class_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      {avg !== null ? (
                        <span className={`font-bold text-base ${avg >= 10 ? 'text-green-700' : 'text-red-700'}`}>
                          {avg.toFixed(2)}
                          <span className="text-xs font-normal text-gray-400 ml-0.5">/20</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <DecisionBadge decision={b.decision} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/bulletin/${b.student_id}/${termId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                                   font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                               -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Voir bulletin
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
