import { getFinancialReport } from '@/actions/analytics'
import { PageHeader } from '@/components/ui/page-header'
import { BarChart } from '@/components/charts/bar-chart'
import { ProgressRing } from '@/components/charts/progress-ring'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ReminderButton } from './reminder-button'

export default async function FinancialReportPage() {
  const report = await getFinancialReport()
  const { totals } = report

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapport Financier"
        description="Vue détaillée des paiements et de la collecte des frais scolaires"
        action={
          <Link href="/admin/payments"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300
                       text-gray-700 text-sm font-medium hover:bg-gray-50 transition">
            ← Gestion paiements
          </Link>
        }
      />

      {/* ── KPIs globaux ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total attendu',      value: formatCurrency(totals?.total_expected   ?? 0), color: 'border-gray-200 bg-gray-50 text-gray-700' },
          { label: 'Collecté',           value: formatCurrency(totals?.total_collected  ?? 0), color: 'border-green-200 bg-green-50 text-green-700' },
          { label: 'En attente',         value: formatCurrency(totals?.total_pending    ?? 0), color: 'border-orange-200 bg-orange-50 text-orange-700' },
          { label: 'Taux de collecte',   value: `${totals?.collectionRate ?? 0}%`,              color: (totals?.collectionRate ?? 0) >= 80 ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-4 ${k.color}`}>
            <p className="text-xs font-medium opacity-70">{k.label}</p>
            <p className="text-2xl font-bold mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Jauge collecte ────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center gap-4">
          <h3 className="text-sm font-semibold text-gray-900">Taux de collecte global</h3>
          <ProgressRing
            value={totals?.collectionRate ?? 0}
            size={120}
            stroke={12}
            color={(totals?.collectionRate ?? 0) >= 80 ? '#10b981' : '#f59e0b'}
          />
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{totals?.collectionRate ?? 0}%</p>
            <p className="text-xs text-gray-400 mt-1">
              {totals?.paid_count ?? 0} payés · {totals?.pending_count ?? 0} en attente
            </p>
          </div>
        </div>

        {/* ── Tendance mensuelle ────────────────────────────────── */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Collecte mensuelle (12 mois)</h3>
          {report.monthlyTrend.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucun paiement enregistré</p>
          ) : (
            <BarChart
              height={150}
              items={report.monthlyTrend.map((m: any) => ({
                label:    m.month,
                value:    Math.round(m.collected || 0),
                maxValue: Math.max(...report.monthlyTrend.map((x: any) => x.collected || 0), 1),
                color:    'bg-green-500',
              }))}
            />
          )}
        </div>
      </div>

      {/* ── Collecte par type de frais ────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Collecte par type de frais</h3>
        </div>
        {report.byFeeType.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucun frais configuré</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Type de frais', 'Prix unitaire', 'Payés', 'En attente', 'Collecté', 'Taux'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.byFeeType.map((ft: any) => {
                const total = (ft.collected || 0) + (ft.pending || 0)
                const rate  = total > 0 ? Math.round(((ft.collected || 0) / total) * 100) : 0
                return (
                  <tr key={ft.fee_name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{ft.fee_name}</td>
                    <td className="px-4 py-3 text-gray-600">{formatCurrency(ft.unit_price)}</td>
                    <td className="px-4 py-3 text-green-700 font-medium">{ft.paid_count}</td>
                    <td className="px-4 py-3 text-orange-700">{ft.pending_count}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(ft.collected || 0)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden w-16">
                          <div className={`h-full rounded-full ${rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                            style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-600">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Collecte par classe ───────────────────────────────── */}
      {report.byClass.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Collecte par classe</h3>
          </div>
          <div className="p-5 space-y-3">
            {report.byClass.map((cls: any) => {
              const total = (cls.collected || 0) + (cls.pending || 0)
              const rate  = total > 0 ? Math.round(((cls.collected || 0) / total) * 100) : 0
              const color = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444'
              return (
                <div key={cls.class_name} className="flex items-center gap-3">
                  <p className="text-sm font-medium text-gray-700 w-24 truncate flex-shrink-0">{cls.class_name}</p>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, backgroundColor: color }} />
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs font-bold" style={{ color }}>{rate}%</span>
                    <span className="text-xs text-green-700">{formatCurrency(cls.collected || 0)}</span>
                    {cls.pending > 0 && (
                      <span className="text-xs text-orange-600">{formatCurrency(cls.pending)}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Liste des impayés ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            Impayés à relancer
            <span className="ml-2 text-xs text-gray-400 font-normal">
              ({report.pendingList.length} dossiers)
            </span>
          </h3>
        </div>
        {report.pendingList.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-green-600 font-medium">🎉 Aucun impayé !</p>
            <p className="text-xs text-gray-400 mt-1">Tous les paiements sont à jour.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Élève', 'Classe', 'Frais', 'Montant', 'Échéance', 'Contact parent', 'Relance'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.pendingList.map((p: any) => {
                  const isOverdue = p.due_date && new Date(p.due_date) < new Date()
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{p.last_name} {p.first_name}</p>
                        <p className="text-xs text-gray-400">{p.student_number}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.class_name}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{p.fee_name}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3">
                        {p.due_date ? (
                          <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                            {isOverdue && '⚠ '}
                            {formatDate(p.due_date)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.parent_phone ? (
                          <div>
                            <p className="text-xs text-gray-700">{p.parent_first_name} {p.parent_last_name}</p>
                            <p className="text-xs text-gray-400">{p.parent_phone}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.parent_phone && (
                          <ReminderButton
                            paymentId={p.id}
                            parentPhone={p.parent_phone}
                            studentName={`${p.first_name} ${p.last_name}`}
                            amount={String(p.amount)}
                            dueDate={p.due_date ? formatDate(p.due_date) : 'dès que possible'}
                          />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
