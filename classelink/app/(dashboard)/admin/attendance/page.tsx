import { getClasses, getTerms, getAttendanceReport } from '@/actions/admin'
import { ExportExcelButton } from '@/components/ui/export-excel-button'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ classId?: string; termId?: string }>
}

export default async function AdminAttendancePage({ searchParams }: Props) {
  const params  = await searchParams
  const [classes, terms] = await Promise.all([getClasses(), getTerms()])

  const selectedClassId = params.classId ?? ''
  const selectedTermId  = params.termId  ?? (terms[0]?.id ?? '')
  const selectedClass   = classes.find((c: any) => c.id === selectedClassId)
  const selectedTerm    = terms.find((t: any) => t.id === selectedTermId)

  const report = selectedClassId && selectedTermId
    ? await getAttendanceReport(selectedClassId, selectedTermId)
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suivi des présences</h1>
        <p className="text-sm text-gray-500 mt-1">
          Rapport des absences et retards par classe et par trimestre.
        </p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Classe
            </label>
            <div className="flex flex-wrap gap-2">
              {classes.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/admin/attendance?classId=${c.id}&termId=${selectedTermId}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    c.id === selectedClassId
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Trimestre
            </label>
            <div className="flex flex-wrap gap-2">
              {terms.map((t: any) => (
                <Link
                  key={t.id}
                  href={`/admin/attendance?classId=${selectedClassId}&termId=${t.id}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    t.id === selectedTermId
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!selectedClassId ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm text-gray-400">Sélectionnez une classe et un trimestre</p>
        </div>
      ) : (
        <>
          {/* Résumé */}
          {selectedClass && selectedTerm && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {selectedClass.name} — {selectedTerm.name}
                </h2>
                <p className="text-xs text-gray-400">{report.length} élèves</p>
              </div>
              <div className="flex gap-3 text-xs flex-wrap">
                {[
                  { label: 'Absences totales', value: report.reduce((s: number, r: any) => s + r.absent_count, 0), color: 'bg-red-100 text-red-700' },
                  { label: 'Non justifiées', value: report.reduce((s: number, r: any) => s + r.unjustified_count, 0), color: 'bg-orange-100 text-orange-700' },
                  { label: 'Retards', value: report.reduce((s: number, r: any) => s + r.late_count, 0), color: 'bg-yellow-100 text-yellow-700' },
                ].map(stat => (
                  <span key={stat.label} className={`px-3 py-1.5 rounded-full font-semibold ${stat.color}`}>
                    {stat.value} {stat.label.toLowerCase()}
                  </span>
                ))}
              </div>
              <ExportExcelButton
                rows={report.map((r: any) => ({
                  'N° élève': r.student_number,
                  'Nom': r.last_name,
                  'Prénom': r.first_name,
                  'Présent': r.present_count,
                  'Absent': r.absent_count,
                  'Retard': r.late_count,
                  'Excusé': r.excused_count,
                  'Non justifié': r.unjustified_count,
                }))}
                filename={`presences_${selectedClass?.name ?? 'classe'}_${selectedTerm?.name ?? ''}.xlsx`}
                sheetName="Présences"
              />
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Élève</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-green-600 uppercase tracking-wide">Présent</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-red-600 uppercase tracking-wide">Absent</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-orange-600 uppercase tracking-wide">Retard</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-blue-600 uppercase tracking-wide">Excusé</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Non just.</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Taux prés.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                      Aucune donnée de présence pour cette période.
                    </td>
                  </tr>
                ) : report.map((row: any) => {
                  const total = row.total_days || 0
                  const rate  = total > 0 ? Math.round((row.present_count / total) * 100) : null
                  return (
                    <tr key={row.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 text-xs
                                          font-bold flex items-center justify-center flex-shrink-0">
                            {row.first_name[0]}{row.last_name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{row.last_name} {row.first_name}</p>
                            <p className="text-xs text-gray-400">{row.student_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-green-700 font-semibold">{row.present_count}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {row.absent_count > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-700 font-semibold text-xs">
                            {row.absent_count}
                          </span>
                        ) : <span className="text-gray-300">0</span>}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {row.late_count > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-semibold text-xs">
                            {row.late_count}
                          </span>
                        ) : <span className="text-gray-300">0</span>}
                      </td>
                      <td className="px-3 py-3 text-center text-blue-600 font-medium">{row.excused_count}</td>
                      <td className="px-3 py-3 text-center">
                        {row.unjustified_count > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-bold text-xs">
                            {row.unjustified_count}
                          </span>
                        ) : <span className="text-gray-300">0</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {rate !== null ? (
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-orange-400' : 'bg-red-500'}`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold ${rate >= 80 ? 'text-green-600' : rate >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
                              {rate}%
                            </span>
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
