// Composant présentationnel réutilisable du bulletin (sans hooks → utilisable
// côté serveur ou client). Reçoit l'objet `data` renvoyé par getBulletinData().

interface BulletinData {
  student: any
  term: any
  school: any
  subjects: any[]
  general_average: string | number | null
  class_average: string | number | null
  rank: string | number | null
  attendance: { total: number; absent: number; late: number; unjustified: number }
  council: any | null
}

const DECISION_CFG: Record<string, { label: string; cls: string }> = {
  PASSAGE:              { label: 'Passage',              cls: 'bg-green-100 text-green-700 border-green-200' },
  PASSAGE_ENCOURAGED:   { label: 'Passage encouragé',   cls: 'bg-teal-100 text-teal-700 border-teal-200' },
  PASSAGE_CONDITIONNEL: { label: 'Passage conditionnel', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  REDOUBLEMENT:         { label: 'Redoublement',         cls: 'bg-red-100 text-red-700 border-red-200' },
  ORIENTATION:          { label: 'Orientation',          cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  EXCLUSION:            { label: 'Exclusion',            cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  FELICITATIONS:        { label: 'Félicitations',        cls: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  ENCOURAGEMENTS:       { label: 'Encouragements',       cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  TABLEAU_HONNEUR:      { label: "Tableau d'honneur",    cls: 'bg-purple-100 text-purple-700 border-purple-200' },
}

function getAppreciation(avg: number | null): string {
  if (avg === null) return '—'
  if (avg >= 16) return 'Très Bien'
  if (avg >= 14) return 'Bien'
  if (avg >= 12) return 'Assez Bien'
  if (avg >= 10) return 'Passable'
  if (avg >= 8)  return 'Insuffisant'
  return 'Très Insuffisant'
}

function avgColorClass(avg: number | null): string {
  if (avg === null) return 'text-gray-400'
  if (avg >= 10) return 'text-green-700'
  return 'text-red-700'
}

function formatDate(d: string | Date | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function toNum(v: string | number | null): number | null {
  if (v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isNaN(n) ? null : n
}

export function BulletinView({ data }: { data: BulletinData }) {
  const { student, term, school, subjects, general_average, class_average, rank, attendance, council } = data

  const genAvg = toNum(general_average)
  const clsAvg = toNum(class_average)
  const rankNum = toNum(rank)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-4xl mx-auto
                    print:border-0 print:rounded-none print:p-0 print:max-w-none print:shadow-none">

      {/* En-tête établissement */}
      <div className="flex items-start justify-between border-b-2 border-gray-800 pb-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg border-2 border-gray-200 flex items-center
                          justify-center text-gray-300 flex-shrink-0">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012
                   20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 uppercase tracking-wide">
              {school?.school_name ?? 'Établissement'}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Année scolaire {student.year_name ?? '—'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-gray-900 uppercase tracking-widest">
            Bulletin de Notes
          </p>
          <p className="text-base text-gray-600 mt-1 font-semibold">{term?.name ?? '—'}</p>
        </div>
      </div>

      {/* Bandeau élève */}
      <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl border border-gray-200 p-4 mb-5">
        <div className="space-y-2">
          <div className="flex text-sm gap-2">
            <span className="text-gray-500 w-28 flex-shrink-0 font-medium">Nom &amp; Prénom</span>
            <span className="font-bold text-gray-900">
              {student.last_name?.toUpperCase()} {student.first_name}
            </span>
          </div>
          <div className="flex text-sm gap-2">
            <span className="text-gray-500 w-28 flex-shrink-0 font-medium">Classe</span>
            <span className="text-gray-900 font-semibold">{student.class_name ?? '—'}</span>
          </div>
          <div className="flex text-sm gap-2">
            <span className="text-gray-500 w-28 flex-shrink-0 font-medium">N° Matricule</span>
            <span className="text-gray-900 font-mono">{student.student_number ?? '—'}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex text-sm gap-2">
            <span className="text-gray-500 w-28 flex-shrink-0 font-medium">Date de naissance</span>
            <span className="text-gray-900">{formatDate(student.date_of_birth)}</span>
          </div>
          <div className="flex text-sm gap-2">
            <span className="text-gray-500 w-28 flex-shrink-0 font-medium">Niveau</span>
            <span className="text-gray-900">{student.level_name ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* Bandeau résultats synthèse */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-center">
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
            Moyenne générale
          </p>
          <p className={`text-4xl font-extrabold ${avgColorClass(genAvg)}`}>
            {genAvg !== null ? genAvg.toFixed(2) : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-1">/20</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
            Rang de classe
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {rankNum !== null ? (
              <>
                {rankNum}
                <sup className="text-lg font-normal">{rankNum === 1 ? 'er' : 'ème'}</sup>
              </>
            ) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">élève(s)</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
            Moyenne de classe
          </p>
          <p className={`text-3xl font-bold ${avgColorClass(clsAvg)}`}>
            {clsAvg !== null ? clsAvg.toFixed(2) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">/20</p>
        </div>
      </div>

      {/* Tableau des matières */}
      {subjects.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-xl py-10 text-center mb-5">
          <p className="text-gray-400 italic text-sm">Aucune note enregistrée pour ce trimestre.</p>
        </div>
      ) : (
        <table className="w-full text-sm mb-6 border border-gray-200 rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-gray-800 text-white">
              {['Matière', 'Coeff.', 'Moyenne', 'Appréciation', 'Observations'].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(subjects as any[]).map((sub: any, i: number) => {
              const avg = toNum(sub.subject_avg)
              return (
                <tr key={sub.subject_id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2.5 font-medium text-gray-900">{sub.subject_name}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600">{sub.coefficient}</td>
                  <td className={`px-3 py-2.5 text-center font-bold ${avgColorClass(avg)}`}>
                    {avg !== null ? avg.toFixed(2) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-gray-500 italic">
                    {getAppreciation(avg)}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-400">—</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 border-t-2 border-gray-800">
              <td colSpan={2} className="px-3 py-3 font-bold text-gray-900 text-right">
                Moyenne générale
              </td>
              <td className={`px-3 py-3 text-center text-xl font-extrabold ${avgColorClass(genAvg)}`}>
                {genAvg !== null ? genAvg.toFixed(2) : '—'}
              </td>
              <td className={`px-3 py-3 font-semibold italic ${avgColorClass(genAvg)}`}>
                {getAppreciation(genAvg)}
              </td>
              <td className="px-3 py-3"></td>
            </tr>
          </tfoot>
        </table>
      )}

      {/* Absences / Retards */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          Absences &amp; Retards — {term?.name}
        </h3>
        <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Absences totales</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Retards</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Non justifiées</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="px-4 py-3">
                <span className={`font-bold text-lg ${attendance.absent > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {attendance.absent}
                </span>
                <span className="text-xs text-gray-400 ml-1">séance(s)</span>
              </td>
              <td className="px-4 py-3">
                <span className={`font-bold text-lg ${attendance.late > 0 ? 'text-orange-600' : 'text-green-700'}`}>
                  {attendance.late}
                </span>
                <span className="text-xs text-gray-400 ml-1">retard(s)</span>
              </td>
              <td className="px-4 py-3">
                <span className={`font-bold text-lg ${attendance.unjustified > 0 ? 'text-red-800' : 'text-green-700'}`}>
                  {attendance.unjustified}
                </span>
                <span className="text-xs text-gray-400 ml-1">non justifiée(s)</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Décision du conseil de classe */}
      {council && (
        <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-800 text-white px-4 py-2.5">
            <p className="text-xs font-bold uppercase tracking-wide">Décision du conseil de classe</p>
          </div>
          <div className="p-4 space-y-3">
            {council.decision && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 font-medium w-28">Décision</span>
                {(() => {
                  const cfg = DECISION_CFG[council.decision] ?? { label: council.decision, cls: 'bg-gray-100 text-gray-600 border-gray-200' }
                  return (
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold border ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                  )
                })()}
              </div>
            )}
            {council.appreciation && (
              <div className="flex gap-3">
                <span className="text-sm text-gray-500 font-medium w-28 flex-shrink-0">Appréciation</span>
                <p className="text-sm text-gray-900 italic">&laquo; {council.appreciation} &raquo;</p>
              </div>
            )}
            {council.council_comment && (
              <div className="flex gap-3">
                <span className="text-sm text-gray-500 font-medium w-28 flex-shrink-0">Commentaire</span>
                <p className="text-sm text-gray-700">{council.council_comment}</p>
              </div>
            )}
            {council.general_notes && (
              <div className="border-t border-gray-100 pt-3 mt-1">
                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Observations générales</p>
                <p className="text-sm text-gray-700">{council.general_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Signatures */}
      <div className="border border-gray-200 rounded-xl p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-5">Signatures</p>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="h-16 border-b-2 border-gray-300 mb-2 rounded-sm bg-gray-50"></div>
            <p className="text-xs text-gray-500 font-medium">Cachet &amp; Signature Direction</p>
            {school?.principal_name && (
              <p className="text-xs text-gray-400 mt-0.5">{school.principal_name}</p>
            )}
          </div>
          <div className="text-center">
            <div className="h-16 border-b-2 border-gray-300 mb-2 rounded-sm bg-gray-50"></div>
            <p className="text-xs text-gray-500 font-medium">Signature Parent / Tuteur</p>
          </div>
          <div className="text-center">
            <div className="h-16 border-b-2 border-gray-300 mb-2 rounded-sm bg-gray-50 flex items-end justify-center pb-1">
              <p className="text-xs text-gray-300">
                {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
            <p className="text-xs text-gray-500 font-medium">Date</p>
          </div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="mt-6 border-t border-gray-100 pt-3 text-center text-xs text-gray-300">
        Bulletin généré par MyClassLink · {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
      </div>
    </div>
  )
}
