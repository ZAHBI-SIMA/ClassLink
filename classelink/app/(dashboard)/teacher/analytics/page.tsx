import { getTeacherClassesWithSubjects, getAtRiskStudents, getStudentProgressData, getTeacherTerms } from '@/actions/teacher'
import { PageHeader } from '@/components/ui/page-header'
import { ExportClient } from './export-client'
import { AtRiskFilter } from './at-risk-filter'

export const metadata = { title: 'Analytiques & Export' }

interface Props {
  searchParams: Promise<{ classId?: string; subjectId?: string }>
}

function avgColor(v: number | null) {
  if (v === null) return 'text-gray-400 bg-gray-50'
  return v >= 14 ? 'text-green-700 bg-green-50' : v >= 10 ? 'text-blue-700 bg-blue-50' : 'text-red-700 bg-red-50'
}

function riskLevel(avg: number | null, absences: number) {
  if (avg !== null && avg < 8) return { label: 'Critique', cls: 'bg-red-100 text-red-800' }
  if (absences > 10) return { label: 'Absentéisme', cls: 'bg-orange-100 text-orange-800' }
  return { label: 'À surveiller', cls: 'bg-yellow-100 text-yellow-800' }
}

export default async function AnalyticsPage({ searchParams }: Props) {
  const { classId, subjectId } = await searchParams

  const [assignments, terms] = await Promise.all([
    getTeacherClassesWithSubjects(),
    getTeacherTerms(),
  ])

  const [atRiskResult, progressResult] = await Promise.all([
    classId ? getAtRiskStudents(classId) : Promise.resolve({ success: true as const, data: [] }),
    (classId && subjectId) ? getStudentProgressData(classId, subjectId) : Promise.resolve({ success: true as const, data: [] }),
  ])

  const atRiskStudents = atRiskResult.success ? (atRiskResult.data ?? []) : []
  const progressData = progressResult.success ? (progressResult.data ?? []) : []

  // Build pivot table: students × terms for progress
  const termNames = [...new Set(progressData.map((r: any) => r.term_name))]
    .sort((a, b) => {
      const aOrder = progressData.find((r: any) => r.term_name === a)?.term_order ?? 0
      const bOrder = progressData.find((r: any) => r.term_name === b)?.term_order ?? 0
      return aOrder - bOrder
    })
  const studentNames = [...new Set(progressData.map((r: any) => r.student_name))]
  const pivotMap: Record<string, Record<string, number | null>> = {}
  for (const row of progressData) {
    if (!pivotMap[row.student_name]) pivotMap[row.student_name] = {}
    pivotMap[row.student_name][row.term_name] = row.avg_20 !== null ? parseFloat(row.avg_20) : null
  }

  // Unique classes for at-risk filter
  const classes = [...new Map(assignments.map((a: any) => [a.class_id, { id: a.class_id, name: a.class_name }])).values()]
  const subjects = assignments
    .filter((a: any) => a.class_id === classId)
    .map((a: any) => ({ id: a.subject_id, name: a.subject_name }))

  const selectedClass = classes.find((c: any) => c.id === classId)
  const selectedSubject = subjects.find((s: any) => s.id === subjectId)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytiques & Export"
        description="Exportez les notes, identifiez les élèves en difficulté et visualisez la progression."
      />

      {/* ── Export CSV ────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Export des notes CSV</h2>
            <p className="text-xs text-gray-500">Téléchargez les notes d'une classe et d'une matière</p>
          </div>
        </div>
        <ExportClient assignments={assignments} terms={terms} />
      </section>

      {/* ── Élèves en difficulté ──────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Élèves en difficulté</h2>
            <p className="text-xs text-gray-500">Moyenne &lt; 10 ou plus de 5 absences/retards</p>
          </div>
        </div>

        {/* Class filter */}
        <AtRiskFilter classId={classId ?? ''} classes={classes} />

        {classId && atRiskStudents.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🎉</div>
            <p className="text-sm font-medium text-gray-700">Aucun élève en difficulté détecté</p>
            <p className="text-xs text-gray-400 mt-1">
              {selectedClass ? `Classe ${selectedClass.name}` : ''} — excellents résultats !
            </p>
          </div>
        ) : atRiskStudents.length > 0 ? (
          <div className="space-y-2">
            {atRiskStudents.map((s: any) => {
              const avg = s.overall_avg !== null ? parseFloat(s.overall_avg) : null
              const risk = riskLevel(avg, s.absence_count)
              return (
                <div key={s.student_id}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg border border-gray-100 bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center
                                  text-xs font-bold text-gray-600 flex-shrink-0">
                    {s.first_name[0]}{s.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {s.first_name} {s.last_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {s.grade_count} note{s.grade_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-3">
                    <div>
                      <p className={`text-sm font-bold ${avg !== null && avg < 10 ? 'text-red-700' : 'text-gray-700'}`}>
                        {avg !== null ? `${avg.toFixed(2)} /20` : '—'}
                      </p>
                      <p className="text-xs text-gray-400">{s.absence_count} abs/ret</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${risk.cls}`}>
                      {risk.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            Sélectionnez une classe pour voir l&apos;analyse.
          </p>
        )}
      </section>

      {/* ── Courbes de progression ──────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Courbes de progression</h2>
            <p className="text-xs text-gray-500">Évolution des moyennes par trimestre</p>
          </div>
        </div>

        <form method="GET" className="mb-4 flex items-center gap-3 flex-wrap">
          <select name="classId" defaultValue={classId ?? ''}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">-- Classe --</option>
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select name="subjectId" defaultValue={subjectId ?? ''}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">-- Matière --</option>
            {subjects.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button type="submit"
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition">
            Voir la progression
          </button>
        </form>

        {classId && subjectId && studentNames.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucune donnée de notes pour cette sélection.</p>
        ) : studentNames.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Élève</th>
                  {termNames.map(t => (
                    <th key={t} className="text-center py-2 px-3 text-xs font-semibold text-gray-500">{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {studentNames.map(name => (
                  <tr key={name} className="hover:bg-gray-50">
                    <td className="py-2 px-3 text-sm font-medium text-gray-900 whitespace-nowrap">{name}</td>
                    {termNames.map(term => {
                      const val = pivotMap[name]?.[term] ?? null
                      return (
                        <td key={term} className="text-center py-2 px-3">
                          {val !== null ? (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${avgColor(val)}`}>
                              {val.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            Sélectionnez une classe et une matière pour voir la progression.
          </p>
        )}
      </section>
    </div>
  )
}
