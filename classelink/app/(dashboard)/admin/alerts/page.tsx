import { getAlertRules, getAlertLogs } from '@/actions/alerts'
import { PageHeader } from '@/components/ui/page-header'
import { AlertsClient } from './alerts-client'

const RULE_LABELS: Record<string, string> = {
  ABSENCE_THRESHOLD: 'Seuil d\'absences',
  PAYMENT_OVERDUE:   'Paiements en retard',
  GRADE_DROP:        'Chute de notes',
  LATE_THRESHOLD:    'Seuil de retards',
}

function formatDateTime(d: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function AlertsPage() {
  const [rules, logs] = await Promise.all([
    getAlertRules(),
    getAlertLogs(20),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertes automatiques"
        description="Configuration et historique des règles d'alerte"
      />

      {/* Cards de configuration */}
      <AlertsClient rules={rules} />

      {/* Dernières alertes déclenchées */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Dernières alertes déclenchées</h3>
        </div>
        {logs.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm text-gray-400">Aucune alerte déclenchée récemment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Date', 'Type', 'Élève', 'Message'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(log.triggered_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                        {RULE_LABELS[log.rule_type] ?? log.rule_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{log.student_name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-sm truncate">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
