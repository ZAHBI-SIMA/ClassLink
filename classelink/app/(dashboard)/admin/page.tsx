import { getAdminKPIs } from '@/actions/admin'
import { KpiCard } from '@/components/ui/kpi-card'
import { PageHeader } from '@/components/ui/page-header'
import { auth } from '@/lib/auth'
import Link from 'next/link'

export const metadata = { title: 'Tableau de bord' }

export default async function AdminDashboard() {
  const session = await auth()
  const user = session?.user as any
  const kpis = await getAdminKPIs()

  const quickActions = [
    { label: 'Inscrire un élève', href: '/admin/students/new', color: 'bg-blue-600' },
    { label: 'Ajouter un enseignant', href: '/admin/teachers/new', color: 'bg-green-600' },
    { label: 'Créer une classe', href: '/admin/classes', color: 'bg-orange-600' },
    { label: 'Configurer les frais', href: '/admin/fees', color: 'bg-purple-600' },
  ]

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${user?.firstName ?? 'Administrateur'} 👋`}
        description={kpis.currentYear
          ? `Année scolaire en cours : ${kpis.currentYear.name}`
          : 'Aucune année scolaire active — configurez-en une pour commencer.'}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <KpiCard
          title="Élèves inscrits"
          value={kpis.totalStudents}
          color="blue"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <KpiCard
          title="Enseignants"
          value={kpis.totalTeachers}
          color="green"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <KpiCard
          title="Classes actives"
          value={kpis.totalClasses}
          color="purple"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <KpiCard
          title="Absences (30 derniers jours)"
          value={kpis.absencesMonth}
          color={kpis.absencesMonth > 20 ? 'red' : 'orange'}
          subtitle="Non justifiées"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <KpiCard
          title="Paiements en retard"
          value={kpis.unpaidFees}
          color={kpis.unpaidFees > 0 ? 'red' : 'green'}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      {/* Actions rapides */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Actions rapides
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(action => (
            <Link
              key={action.href}
              href={action.href}
              className={`${action.color} text-white rounded-xl p-4 text-sm font-medium
                          hover:opacity-90 transition text-center`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Alerte aucune année scolaire */}
      {!kpis.currentYear && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Aucune année scolaire active</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Commencez par{' '}
              <Link href="/admin/academic-years" className="underline font-medium">
                créer une année scolaire
              </Link>{' '}
              avant d&apos;inscrire des élèves.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
