import { notFound } from 'next/navigation'
import { getSchoolById, getPlans, toggleSchoolStatus, extendTrial, repairTenantSchema } from '@/actions/super-admin'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { DeleteSchoolDialog } from './delete-school-dialog'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SchoolDetailPage({ params }: Props) {
  const { id } = await params
  const [school, plans] = await Promise.all([getSchoolById(id), getPlans()])

  if (!school) notFound()

  const isSuspended = school.status === 'SUSPENDED'
  const isTrial = school.status === 'TRIAL'

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/super-admin/schools" className="text-gray-400 hover:text-gray-600">
          Établissements
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-medium">{school.name}</span>
      </div>

      {/* En-tête */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center
                            text-blue-700 font-bold text-2xl">
              {school.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{school.name}</h2>
              <p className="text-sm text-gray-500">{school.adminEmail}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <StatusBadge status={school.status} />
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {school.plan?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <form action={toggleSchoolStatus.bind(null, school.id, !isSuspended)}>
              <button
                type="submit"
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isSuspended
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}
              >
                {isSuspended ? 'Réactiver' : 'Suspendre'}
              </button>
            </form>

            {isTrial && (
              <form action={extendTrial.bind(null, school.id, 30)}>
                <button
                  type="submit"
                  className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-blue-100
                             text-blue-700 hover:bg-blue-200 transition"
                >
                  +30 jours d&apos;essai
                </button>
              </form>
            )}

            <form action={async () => {
              'use server'
              await repairTenantSchema(school.id)
            }}>
              <button
                type="submit"
                className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-purple-100
                           text-purple-700 hover:bg-purple-200 transition"
              >
                Réparer le schéma
              </button>
            </form>

            <DeleteSchoolDialog schoolId={school.id} schoolName={school.name} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Informations */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Informations</h3>
          <dl className="space-y-3 text-sm">
            {[
              { label: 'Identifiant', value: school.id },
              { label: 'Slug', value: school.slug },
              { label: 'Schéma DB', value: school.schemaName },
              { label: 'Sous-domaine', value: school.subdomain ?? '—' },
              { label: 'Ville', value: school.city ?? '—' },
              { label: 'Pays', value: school.country },
              { label: 'Téléphone', value: school.phone ?? '—' },
              { label: 'Créée le', value: formatDateTime(school.createdAt) },
            ].map(row => (
              <div key={row.label} className="flex justify-between gap-2">
                <dt className="text-gray-500 flex-shrink-0">{row.label}</dt>
                <dd className="text-gray-900 font-medium text-right break-all">{row.value}</dd>
              </div>
            ))}
            {isTrial && school.trialEndsAt && (
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500 flex-shrink-0">Fin d&apos;essai</dt>
                <dd className={`font-medium text-right ${
                  new Date(school.trialEndsAt) < new Date() ? 'text-red-600' : 'text-orange-600'
                }`}>
                  {formatDate(school.trialEndsAt)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Abonnement & paiements */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Abonnement</h3>
          {!school.subscription ? (
            <p className="text-sm text-gray-400">Aucun abonnement actif</p>
          ) : (
            <>
              <dl className="space-y-3 text-sm mb-5">
                {[
                  { label: 'Plan', value: school.plan?.name },
                  { label: 'Facturation', value: school.subscription.billing === 'YEARLY' ? 'Annuelle' : 'Mensuelle' },
                  { label: 'Statut', value: <StatusBadge status={school.subscription.status} size="sm" /> },
                  { label: 'Période en cours', value: `${formatDate(school.subscription.currentPeriodStart)} → ${formatDate(school.subscription.currentPeriodEnd)}` },
                ].map(row => (
                  <div key={row.label} className="flex justify-between gap-2">
                    <dt className="text-gray-500">{row.label}</dt>
                    <dd className="text-gray-900 font-medium text-right">{row.value}</dd>
                  </div>
                ))}
              </dl>

              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Derniers paiements
              </h4>
              <div className="space-y-2">
                {school.subscription.payments.length === 0 ? (
                  <p className="text-sm text-gray-400">Aucun paiement</p>
                ) : (
                  school.subscription.payments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{formatDate(p.createdAt)}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{formatCurrency(p.amount)}</span>
                        <StatusBadge status={p.status} size="sm" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notes super admin */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Notes internes</h3>
        <form method="POST" className="space-y-3">
          <textarea
            name="superAdminNotes"
            defaultValue={school.superAdminNotes ?? ''}
            rows={3}
            placeholder="Notes visibles uniquement par les super admins..."
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium
                       hover:bg-gray-200 transition"
          >
            Enregistrer les notes
          </button>
        </form>
      </div>
    </div>
  )
}
