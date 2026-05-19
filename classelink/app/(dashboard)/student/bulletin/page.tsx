import { requireRole } from '@/lib/auth/rbac'
import { getTenantPrisma } from '@/lib/db/tenant'
import Link from 'next/link'

export default async function StudentBulletinListPage() {
  const session = await requireRole('STUDENT')
  const db = getTenantPrisma(session.user.schemaName) as any

  // Récupérer le student_id depuis la session utilisateur
  const studentRows: any[] = await db.$queryRaw`
    SELECT s.id FROM students s WHERE s.user_id = ${session.user.id} LIMIT 1
  `
  const studentId = studentRows[0]?.id ?? null

  // Récupérer les trimestres disponibles
  const terms: any[] = studentId
    ? await db.$queryRaw`
        SELECT t.id, t.name, t.term_order
        FROM terms t
        JOIN academic_years ay ON ay.id = t.academic_year_id AND ay.is_current = TRUE
        ORDER BY t.term_order
      `
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes bulletins</h1>
        <p className="text-sm text-gray-500 mt-1">Consultez vos bulletins de notes par trimestre.</p>
      </div>

      {!studentId ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl bg-white">
          <p className="text-sm text-gray-500">Profil élève introuvable. Contactez l&apos;administration.</p>
        </div>
      ) : terms.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl bg-white">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-gray-500 font-medium">Aucun bulletin disponible</p>
          <p className="text-xs text-gray-400 mt-1">Les bulletins seront disponibles à la fin de chaque trimestre.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {terms.map((term: any) => (
            <div key={term.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-green-300 hover:bg-green-50 transition group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold group-hover:bg-green-600 group-hover:text-white transition">
                  T{term.term_order}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{term.name}</p>
                  <p className="text-xs text-gray-400">Trimestre {term.term_order}</p>
                </div>
              </div>
              <Link
                href={`/student/bulletin/${term.id}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Voir mon bulletin
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
