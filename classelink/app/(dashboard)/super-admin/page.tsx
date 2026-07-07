import { getSuperAdminKPIs } from '@/actions/super-admin'
import { KpiCard } from '@/components/ui/kpi-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { PageHeader } from '@/components/ui/page-header'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function SuperAdminPage() {
  const kpis = await getSuperAdminKPIs()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de la plateforme MyClassLink"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Établissements actifs"
          value={kpis.activeSchools}
          subtitle={`${kpis.totalSchools} au total`}
          color="blue"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <KpiCard
          title="En période d'essai"
          value={kpis.trialSchools}
          subtitle="Essais gratuits 30j"
          color="orange"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          title="MRR"
          value={formatCurrency(kpis.mrr)}
          subtitle={`ARR : ${formatCurrency(kpis.arr)}`}
          color="green"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          title="Suspendus"
          value={kpis.suspendedSchools}
          subtitle="Requièrent attention"
          color={kpis.suspendedSchools > 0 ? 'red' : 'green'}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.834-2.694-.834-3.464 0L3.34 16.5c-.77.833.193 2.5 1.732 2.5z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Derniers établissements */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Derniers établissements</h3>
            <Link href="/super-admin/schools"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Voir tout →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {kpis.recentSchools.length === 0 ? (
              <p className="p-5 text-sm text-gray-400 text-center">Aucun établissement</p>
            ) : (
              kpis.recentSchools.map((school: any) => (
                <div key={school.id} className="flex items-center gap-3 px-5 py-3.5">
                  {/* Avatar école */}
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center
                                  text-blue-700 font-bold text-sm flex-shrink-0">
                    {school.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{school.name}</p>
                    <p className="text-xs text-gray-400">{school.plan?.name} · {formatDate(school.createdAt)}</p>
                  </div>
                  <StatusBadge status={school.status} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Derniers paiements */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Derniers paiements SaaS</h3>
            <Link href="/super-admin/subscriptions"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Voir tout →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {kpis.recentPayments.length === 0 ? (
              <p className="p-5 text-sm text-gray-400 text-center">Aucun paiement</p>
            ) : (
              kpis.recentPayments.map((payment: any) => (
                <div key={payment.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {payment.subscription?.school?.name}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(payment.createdAt)}</p>
                  </div>
                  <p className="text-sm font-semibold text-green-700 flex-shrink-0">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
