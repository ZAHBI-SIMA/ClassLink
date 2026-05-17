import { getBulletin, getStudentById, getTerms } from '@/actions/admin'
import { PrintButton } from './print-button'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ studentId: string; termId: string }>
}

const TYPE_LABELS: Record<string, string> = {
  DEVOIR: 'Dev.', INTERROGATION: 'Interro.', COMPOSITION: 'Compo.', EXAM: 'Exam.',
}

function avgColor(avg: number | null) {
  if (avg === null) return 'text-gray-400'
  return avg >= 10 ? 'text-green-700' : 'text-red-700'
}

export default async function BulletinPage({ params }: Props) {
  const { studentId, termId } = await params
  const data = await getBulletin(studentId, termId)
  if (!data) notFound()

  const { school, profile, term, subjectRows, generalAverage, appreciation, attendance, rank, totalStudents } = data

  return (
    <>
      {/* Barre d'actions — masquée à l'impression */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/admin/students" className="hover:text-blue-600">Élèves</Link>
          <span>›</span>
          <Link href={`/admin/students/${studentId}`} className="hover:text-blue-600">
            {profile.first_name} {profile.last_name}
          </Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Bulletin — {term.name}</span>
        </div>
        <PrintButton />
      </div>

      {/* ══════════════════ BULLETIN (zone imprimable) ══════════════════ */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-3xl mx-auto
                      print:border-0 print:rounded-none print:p-0 print:max-w-none print:mx-0">

        {/* En-tête école */}
        <div className="flex items-start justify-between border-b-2 border-gray-800 pb-4 mb-5">
          <div>
            <p className="text-xl font-bold text-gray-900 uppercase tracking-wide">
              {school.school_name ?? 'Établissement'}
            </p>
            {school.address && <p className="text-xs text-gray-500 mt-0.5">{school.address}</p>}
            {school.phone   && <p className="text-xs text-gray-500">{school.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900 uppercase">Bulletin de notes</p>
            <p className="text-sm text-gray-600 mt-0.5">{term.name} — {profile.year_name ?? ''}</p>
          </div>
        </div>

        {/* Informations élève */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4 mb-5 border border-gray-200">
          <div className="space-y-1.5">
            <div className="flex gap-2 text-sm">
              <span className="text-gray-500 w-24 flex-shrink-0">Nom & Prénom</span>
              <span className="font-semibold text-gray-900">
                {profile.last_name.toUpperCase()} {profile.first_name}
              </span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="text-gray-500 w-24 flex-shrink-0">N° Élève</span>
              <span className="font-mono text-gray-900">{profile.student_number ?? '—'}</span>
            </div>
            {profile.date_of_birth && (
              <div className="flex gap-2 text-sm">
                <span className="text-gray-500 w-24 flex-shrink-0">Né(e) le</span>
                <span className="text-gray-900">
                  {new Date(profile.date_of_birth).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex gap-2 text-sm">
              <span className="text-gray-500 w-20 flex-shrink-0">Classe</span>
              <span className="font-semibold text-gray-900">{profile.class_name ?? '—'}</span>
            </div>
            {rank !== null && totalStudents !== null && (
              <div className="flex gap-2 text-sm">
                <span className="text-gray-500 w-20 flex-shrink-0">Rang</span>
                <span className="font-semibold text-gray-900">
                  {rank}<sup>{rank === 1 ? 'er' : 'ème'}</sup> / {totalStudents} élèves
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tableau des notes */}
        {subjectRows.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-8">Aucune note enregistrée pour ce trimestre.</p>
        ) : (
          <table className="w-full text-sm mb-5 border border-gray-300 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-800 text-white text-xs uppercase tracking-wide">
                <th className="text-left px-3 py-2.5">Matière</th>
                <th className="text-center px-3 py-2.5">Coeff.</th>
                <th className="text-center px-3 py-2.5 hidden md:table-cell print:table-cell">Notes</th>
                <th className="text-center px-3 py-2.5">Moy. / 20</th>
                <th className="text-left px-3 py-2.5">Appréciation</th>
              </tr>
            </thead>
            <tbody>
              {subjectRows.map((sub: any, i: number) => (
                <tr key={sub.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 font-medium text-gray-900">
                    <span className="text-xs text-gray-400 mr-1.5">{sub.code}</span>
                    {sub.name}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-600">{sub.coefficient}</td>
                  <td className="px-3 py-2 text-center hidden md:table-cell print:table-cell">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {sub.grades.map((g: any, gi: number) => (
                        <span key={gi} className="text-xs text-gray-500">
                          {TYPE_LABELS[g.type] ?? g.type} <strong>{parseFloat(g.value).toFixed(2)}</strong>
                          {gi < sub.grades.length - 1 && <span className="text-gray-300 mx-0.5">·</span>}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={`px-3 py-2 text-center font-bold ${avgColor(sub.average)}`}>
                    {sub.average !== null ? sub.average.toFixed(2) : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500 italic">
                    {sub.average !== null
                      ? (sub.average >= 16 ? 'Très bien'
                        : sub.average >= 14 ? 'Bien'
                        : sub.average >= 12 ? 'Assez bien'
                        : sub.average >= 10 ? 'Passable'
                        : 'Insuffisant')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 border-t-2 border-gray-800">
                <td colSpan={3} className="px-3 py-2.5 font-bold text-gray-900 text-right hidden md:table-cell print:table-cell">
                  Moyenne générale
                </td>
                <td className="px-3 py-2.5 font-bold text-gray-900 text-right md:hidden print:hidden">
                  Moy. générale
                </td>
                <td className={`px-3 py-2.5 text-center text-lg font-bold ${avgColor(generalAverage)}`}>
                  {generalAverage !== null ? generalAverage.toFixed(2) : '—'}
                </td>
                <td className={`px-3 py-2.5 font-semibold italic ${avgColor(generalAverage)}`}>
                  {appreciation}
                </td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* Présences */}
        <div className="grid grid-cols-2 gap-5 mb-6">
          <div className="border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Présences — {term.name}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Absences :</span>
                <span className={`ml-1 font-semibold ${attendance.absent > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {attendance.absent}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Retards :</span>
                <span className={`ml-1 font-semibold ${attendance.late > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                  {attendance.late}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Non justif. :</span>
                <span className={`ml-1 font-semibold ${attendance.unjustified > 0 ? 'text-red-800' : 'text-green-700'}`}>
                  {attendance.unjustified}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Signatures</p>
            <div className="flex justify-between text-xs text-gray-500 mt-4">
              <div className="text-center">
                <div className="h-8 border-b border-gray-300 w-24 mb-1"></div>
                <p>Le directeur</p>
              </div>
              <div className="text-center">
                <div className="h-8 border-b border-gray-300 w-24 mb-1"></div>
                <p>Parent / Tuteur</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="border-t border-gray-200 pt-3 text-center text-xs text-gray-400">
          Bulletin généré par ClasseLink · {new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>

      {/* Styles d'impression */}
      <style>{`
        @media print {
          body { background: white !important; }
          @page { margin: 1cm; size: A4; }
        }
      `}</style>
    </>
  )
}
