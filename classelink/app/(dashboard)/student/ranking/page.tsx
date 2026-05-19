import { requireRole } from '@/lib/auth/rbac'
import { getTenantPrisma } from '@/lib/db/tenant'
import { getBulletinList } from '@/actions/bulletin'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ termId?: string }>
}

export default async function StudentRankingPage({ searchParams }: Props) {
  const { termId: selectedTermId } = await searchParams

  const session = await requireRole('STUDENT')
  const db = getTenantPrisma(session.user.schemaName) as any

  // Récupérer le student et sa classe
  const studentRows: any[] = await db.$queryRaw`
    SELECT
      s.id AS student_id,
      u.first_name, u.last_name,
      e.class_id,
      c.name AS class_name
    FROM students s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'ACTIVE'
    LEFT JOIN classes c ON c.id = e.class_id
    WHERE s.user_id = ${session.user.id}
    LIMIT 1
  `
  const me = studentRows[0] ?? null

  // Récupérer les trimestres
  const terms: any[] = me
    ? await db.$queryRaw`
        SELECT t.id, t.name, t.term_order
        FROM terms t
        JOIN academic_years ay ON ay.id = t.academic_year_id AND ay.is_current = TRUE
        ORDER BY t.term_order
      `
    : []

  const currentTermId = selectedTermId ?? terms[0]?.id ?? null
  const currentTerm = terms.find((t: any) => t.id === currentTermId)

  // Classement de la classe pour le trimestre sélectionné
  const rankings = me?.class_id && currentTermId
    ? await getBulletinList(me.class_id, currentTermId)
    : []

  // Trimestre précédent pour l'évolution
  const currentTermOrder = currentTerm?.term_order ?? null
  const prevTerm = currentTermOrder && currentTermOrder > 1
    ? terms.find((t: any) => t.term_order === currentTermOrder - 1)
    : null

  const prevRankings = me?.class_id && prevTerm
    ? await getBulletinList(me.class_id, prevTerm.id)
    : []

  // Ma position
  const myRank = rankings.find((r: any) => r.student_id === me?.student_id)
  const myPrevRank = prevRankings.find((r: any) => r.student_id === me?.student_id)

  const myAvg = myRank?.average !== null && myRank?.average !== undefined
    ? parseFloat(String(myRank.average))
    : null
  const myPrevAvg = myPrevRank?.average !== null && myPrevRank?.average !== undefined
    ? parseFloat(String(myPrevRank.average))
    : null

  const top10 = rankings.slice(0, 10)
  const maxAvg = top10.length > 0
    ? Math.max(...top10.map((r: any) => parseFloat(String(r.average ?? 0))))
    : 20

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon classement</h1>
        <p className="text-sm text-gray-500 mt-1">
          Classement de votre classe — {me?.class_name ?? 'classe non assignée'}
        </p>
      </div>

      {/* Sélecteur trimestre */}
      {terms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {terms.map((t: any) => (
            <Link key={t.id} href={`/student/ranking?termId=${t.id}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                t.id === currentTermId
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
              }`}>
              {t.name}
            </Link>
          ))}
        </div>
      )}

      {/* Ma position */}
      {myRank && (
        <div className="bg-purple-600 text-white rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-3">Ma position — {currentTerm?.name}</p>
          <div className="flex items-center justify-between gap-4">
            <div className="text-center">
              <p className="text-xs opacity-70 mb-1">Rang</p>
              <p className="text-3xl font-bold">
                {myRank.rank}
                <sup className="text-base font-normal">{myRank.rank === 1 ? 'er' : 'ème'}</sup>
              </p>
              <p className="text-xs opacity-70 mt-0.5">/ {rankings.length} élèves</p>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <p className="text-xs opacity-70 mb-1">Moyenne</p>
              <p className="text-3xl font-bold">
                {myAvg !== null ? myAvg.toFixed(2) : '—'}
                <span className="text-base font-normal opacity-70"> / 20</span>
              </p>
            </div>
            {myPrevAvg !== null && myAvg !== null && (
              <>
                <div className="w-px h-12 bg-white/20"></div>
                <div className="text-center">
                  <p className="text-xs opacity-70 mb-1">Évolution</p>
                  <p className={`text-2xl font-bold ${myAvg >= myPrevAvg ? 'text-green-300' : 'text-red-300'}`}>
                    {myAvg >= myPrevAvg ? '+' : ''}{(myAvg - myPrevAvg).toFixed(2)}
                  </p>
                  <p className="text-xs opacity-70 mt-0.5">vs {prevTerm?.name}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Graphique barres CSS des 10 premiers */}
      {top10.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Top 10 de la classe</p>
          <div className="space-y-2">
            {top10.map((r: any, i: number) => {
              const avg = parseFloat(String(r.average ?? 0))
              const barWidth = maxAvg > 0 ? (avg / maxAvg) * 100 : 0
              const isMe = r.student_id === me?.student_id
              return (
                <div key={r.student_id} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 text-right flex-shrink-0 ${isMe ? 'text-purple-600' : 'text-gray-400'}`}>
                    {i + 1}
                  </span>
                  <span className={`text-xs w-32 truncate flex-shrink-0 ${isMe ? 'font-bold text-purple-700' : 'text-gray-700'}`}>
                    {r.first_name} {r.last_name}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isMe ? 'bg-purple-500' : 'bg-green-400'}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold w-10 text-right flex-shrink-0 ${avg >= 10 ? 'text-green-700' : 'text-red-700'}`}>
                    {avg.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tableau complet */}
      {rankings.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl bg-white">
          <p className="text-sm text-gray-400">Aucun classement disponible pour ce trimestre.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Classement complet — {currentTerm?.name}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-12">Rang</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Élève</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Moyenne / 20</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Décision</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((r: any) => {
                  const isMe = r.student_id === me?.student_id
                  const avg = r.average !== null ? parseFloat(String(r.average)) : null
                  return (
                    <tr
                      key={r.student_id}
                      className={`border-b border-gray-50 last:border-0 ${isMe ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-bold ${isMe ? 'text-purple-700' : 'text-gray-500'}`}>
                          {r.rank}
                          <sup className="text-xs font-normal">{r.rank === 1 ? 'er' : 'e'}</sup>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${isMe ? 'text-purple-800' : 'text-gray-900'}`}>
                          {r.first_name} {r.last_name}
                          {isMe && (
                            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">Moi</span>
                          )}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-center font-bold ${avg !== null ? (avg >= 10 ? 'text-green-700' : 'text-red-700') : 'text-gray-400'}`}>
                        {avg !== null ? avg.toFixed(2) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                        {r.decision ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
