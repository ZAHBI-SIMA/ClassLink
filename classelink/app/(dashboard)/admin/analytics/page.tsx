import { getAdminAnalytics } from '@/actions/analytics'
import { PageHeader } from '@/components/ui/page-header'
import { BarChart } from '@/components/charts/bar-chart'
import { ProgressRing } from '@/components/charts/progress-ring'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

function StatCard({ title, value, subtitle, color = 'blue' }: {
  title: string; value: string | number; subtitle?: string; color?: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color] ?? colors.blue}`}>
      <p className="text-xs font-medium opacity-70">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-xs mt-0.5 opacity-60">{subtitle}</p>}
    </div>
  )
}

export default async function AnalyticsPage() {
  const data = await getAdminAnalytics()

  const maxClassAvg = Math.max(...data.averagesByClass.map((c: any) => parseFloat(c.average) || 0), 1)
  const maxSubjAvg  = Math.max(...data.averagesBySubject.map((s: any) => parseFloat(s.average) || 0), 1)
  const maxPayment  = Math.max(...data.paymentTrend.map((m: any) => m.collected || 0), 1)

  const collectionRate = data.paymentStats
    ? data.paymentStats.collected > 0 || data.paymentStats.pending > 0
      ? Math.round((data.paymentStats.collected / (data.paymentStats.collected + data.paymentStats.pending)) * 100)
      : 100
    : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reporting"
        description="Tableau de bord analytique de l'établissement"
        action={
          <Link href="/admin/payments/report"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300
                       text-gray-700 text-sm font-medium hover:bg-gray-50 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Rapport financier
          </Link>
        }
      />

      {/* KPIs synthétiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Élèves actifs"       value={data.totalStudents}           color="blue" />
        <StatCard title="Taux de présence"    value={`${data.attendanceSummary.attendanceRate}%`}
                  subtitle={`${data.attendanceSummary.present} présences / ${data.attendanceSummary.total} séances`}
                  color={data.attendanceSummary.attendanceRate >= 80 ? 'green' : 'orange'} />
        <StatCard title="Collecte paiements"  value={`${collectionRate}%`}
                  subtitle={formatCurrency(data.paymentStats?.collected ?? 0)}
                  color={collectionRate >= 80 ? 'green' : 'orange'} />
        <StatCard title="Impayés"             value={data.paymentStats?.pending_count ?? 0}
                  subtitle={formatCurrency(data.paymentStats?.pending ?? 0)}
                  color={data.paymentStats?.pending_count > 0 ? 'red' : 'green'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Présence : anneaux ───────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Répartition des présences</h3>
          <div className="flex justify-around">
            {[
              { label: 'Présents',  value: data.attendanceSummary.present,  total: data.attendanceSummary.total, color: '#10b981' },
              { label: 'Absents',   value: data.attendanceSummary.absent,   total: data.attendanceSummary.total, color: '#ef4444' },
              { label: 'Retards',   value: data.attendanceSummary.late,     total: data.attendanceSummary.total, color: '#f59e0b' },
              { label: 'Excusés',   value: data.attendanceSummary.excused,  total: data.attendanceSummary.total, color: '#6366f1' },
            ].map(item => {
              const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0
              return (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <ProgressRing value={pct} size={64} stroke={6} color={item.color} />
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-900">{pct}%</p>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Distribution des notes ───────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Distribution des notes</h3>
          {data.gradeDistribution.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune note enregistrée</p>
          ) : (
            <BarChart
              height={140}
              items={data.gradeDistribution.map((g: any) => ({
                label:    `/20 ${g.range}`,
                value:    g.count,
                maxValue: Math.max(...data.gradeDistribution.map((x: any) => x.count)),
                color:    g.range === '15-20' ? 'bg-green-500' : g.range === '10-15' ? 'bg-blue-500' : g.range === '5-10' ? 'bg-orange-500' : 'bg-red-500',
              }))}
            />
          )}
        </div>

        {/* ── Évolution moyennes par trimestre ─────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Évolution par trimestre</h3>
          {data.gradeEvolution.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <BarChart
              height={140}
              items={data.gradeEvolution.map((t: any) => ({
                label:    t.term_name,
                value:    parseFloat(t.average) || 0,
                maxValue: 20,
                color:    'bg-violet-500',
                suffix:   '/20',
              }))}
            />
          )}
        </div>
      </div>

      {/* ── Moyennes par classe ──────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Performance par classe</h3>
          <span className="text-xs text-gray-400">{data.averagesByClass.length} classes</span>
        </div>
        {data.averagesByClass.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune donnée de notes</p>
        ) : (
          <div className="p-5 space-y-3">
            {data.averagesByClass.map((cls: any) => {
              const avg = parseFloat(cls.average) || 0
              const pct = Math.round((avg / 20) * 100)
              const color = avg >= 14 ? '#10b981' : avg >= 10 ? '#3b82f6' : avg >= 7 ? '#f59e0b' : '#ef4444'
              return (
                <div key={cls.class_name} className="flex items-center gap-3">
                  <p className="text-sm font-medium text-gray-700 w-24 truncate flex-shrink-0">{cls.class_name}</p>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold" style={{ color }}>{avg.toFixed(2)}/20</span>
                    <span className="text-xs text-gray-400">{cls.student_count} élèves</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Taux présence par classe ─────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Taux de présence par classe</h3>
          </div>
          {data.attendanceByClass.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="p-5 space-y-3">
              {data.attendanceByClass.map((cls: any) => {
                const rate  = parseFloat(cls.attendance_rate) || 0
                const color = rate >= 90 ? '#10b981' : rate >= 75 ? '#f59e0b' : '#ef4444'
                return (
                  <div key={cls.class_name} className="flex items-center gap-3">
                    <p className="text-sm font-medium text-gray-700 w-24 truncate flex-shrink-0">{cls.class_name}</p>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-sm font-bold flex-shrink-0" style={{ color }}>{rate}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Tendance paiements ───────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Collecte mensuelle (6 mois)</h3>
            <Link href="/admin/payments/report"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Rapport complet →
            </Link>
          </div>
          <div className="p-5">
            {data.paymentTrend.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucun paiement</p>
            ) : (
              <BarChart
                height={140}
                items={data.paymentTrend.map((m: any) => ({
                  label:    m.month,
                  value:    Math.round(m.collected || 0),
                  maxValue: maxPayment,
                  color:    'bg-green-500',
                  suffix:   ' F',
                }))}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Moyennes par matière ─────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Performance par matière</h3>
        </div>
        {data.averagesBySubject.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Matière', 'Code', 'Moyenne /20', 'Nb notes', 'Appréciation'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.averagesBySubject.map((s: any) => {
                const avg   = parseFloat(s.average) || 0
                const appre = avg >= 16 ? 'Très Bien' : avg >= 14 ? 'Bien' : avg >= 12 ? 'Assez Bien' : avg >= 10 ? 'Passable' : 'Insuffisant'
                const cls   = avg >= 14 ? 'text-green-700 bg-green-100' : avg >= 10 ? 'text-blue-700 bg-blue-100' : 'text-red-700 bg-red-100'
                return (
                  <tr key={s.subject_name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.subject_name}</td>
                    <td className="px-4 py-3"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{s.subject_code ?? '—'}</span></td>
                    <td className="px-4 py-3">
                      <span className={`font-bold text-sm px-2 py-0.5 rounded-full ${cls}`}>{avg.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.grade_count}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{appre}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Inscriptions par niveau ──────────────────────────── */}
      {data.enrollmentByLevel.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Effectifs par niveau</h3>
          <BarChart
            height={120}
            items={data.enrollmentByLevel.map((l: any) => ({
              label:    l.level_name,
              value:    l.student_count,
              maxValue: Math.max(...data.enrollmentByLevel.map((x: any) => x.student_count)),
              color:    'bg-blue-500',
            }))}
          />
        </div>
      )}
    </div>
  )
}
