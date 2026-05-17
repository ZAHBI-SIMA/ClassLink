import { getStudentProfile, getStudentTerms, getStudentAttendanceSummary, getStudentPayments } from '@/actions/student'
import { getAnnouncements } from '@/actions/announcements'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default async function StudentDashboardPage() {
  const [profile, terms, attendance, payments, announcements] = await Promise.all([
    getStudentProfile(),
    getStudentTerms(),
    getStudentAttendanceSummary(),
    getStudentPayments(),
    getAnnouncements(),
  ])

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Profil élève introuvable. Contactez votre administrateur.</p>
      </div>
    )
  }

  const pendingPayments = payments.filter((p: any) => p.status === 'PENDING')
  const totalAbsences = attendance.reduce((s: number, t: any) => s + t.absent, 0)

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center
                        text-green-700 font-bold text-xl flex-shrink-0">
          {profile.first_name[0]}{profile.last_name[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour, {profile.first_name} !
          </h1>
          <p className="text-sm text-gray-500">
            {profile.class_name ? `${profile.class_name} · ` : ''}{profile.year_name ?? ''}
          </p>
        </div>
      </div>

      {/* Alertes */}
      {pendingPayments.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-yellow-800">
              {pendingPayments.length} paiement{pendingPayments.length > 1 ? 's' : ''} en attente
            </p>
            <p className="text-xs text-yellow-700 mt-0.5">
              Total dû : {formatCurrency(pendingPayments.reduce((s: number, p: any) => s + p.amount, 0))}
            </p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">N° élève</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{profile.student_number}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Absences (total)</p>
          <p className={`text-lg font-bold mt-1 ${totalAbsences > 5 ? 'text-red-600' : 'text-gray-900'}`}>
            {totalAbsences}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Frais en attente</p>
          <p className={`text-lg font-bold mt-1 ${pendingPayments.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
            {pendingPayments.length === 0 ? 'À jour' : formatCurrency(pendingPayments.reduce((s: number, p: any) => s + p.amount, 0))}
          </p>
        </div>
      </div>

      {/* Trimestres */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Trimestres</h2>
          <Link href="/student/grades" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Voir mes notes →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {terms.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400 text-center">Aucun trimestre configuré.</p>
          ) : terms.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center
                                text-green-700 text-xs font-bold">
                  T{t.term_order}
                </div>
                <span className="text-sm font-medium text-gray-900">{t.name}</span>
              </div>
              <Link
                href={`/student/grades?termId=${t.id}`}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Voir les notes →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Présences résumé */}
      {attendance.some((t: any) => t.total > 0) && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Présences par trimestre</h2>
            <Link href="/student/attendance" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Détails →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {attendance.map((t: any) => {
              const rate = t.total > 0 ? Math.round((t.present / t.total) * 100) : null
              return (
                <div key={t.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-gray-700">{t.term_name}</span>
                  <div className="flex items-center gap-3">
                    {t.absent > 0 && (
                      <span className="text-xs text-red-600 font-medium">{t.absent} abs.</span>
                    )}
                    {rate !== null && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${rate >= 80 ? 'bg-green-500' : 'bg-orange-400'}`}
                            style={{ width: `${rate}%` }} />
                        </div>
                        <span className={`text-xs font-semibold ${rate >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                          {rate}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Annonces récentes */}
      {announcements.slice(0, 3).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Annonces récentes</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {announcements.slice(0, 3).map((a: any) => (
              <div key={a.id} className="px-5 py-4">
                <div className="flex items-start gap-2">
                  {a.is_pinned && (
                    <span className="mt-0.5 inline-flex text-amber-500 flex-shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(a.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
