import { getParentChildren, getParentSubscriptionStatus } from '@/actions/parent'
import { getAnnouncements } from '@/actions/announcements'
import { AnnouncementItem } from '@/components/ui/announcement-item'
import { PaySubscriptionButton } from '@/components/ui/pay-subscription-button'
import Link from 'next/link'

export default async function ParentDashboardPage() {
  const [children, announcements, subscription] = await Promise.all([
    getParentChildren(),
    getAnnouncements(),
    getParentSubscriptionStatus(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">
          {children.length === 0
            ? 'Aucun enfant associé à votre compte.'
            : `Vous suivez ${children.length} élève${children.length > 1 ? 's' : ''}.`}
        </p>
      </div>

      {subscription.success && subscription.data && !subscription.data.paid && subscription.data.childrenCount > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Abonnement MyClassLink non réglé</p>
              <p className="text-xs text-gray-500">
                {subscription.data.childrenCount} enfant{subscription.data.childrenCount > 1 ? 's' : ''} × 2 000 FCFA ={' '}
                {subscription.data.amountDue.toLocaleString('fr-FR')} FCFA/an — certaines fonctionnalités sont verrouillées.
              </p>
            </div>
          </div>
          <PaySubscriptionButton label="Régulariser" />
        </div>
      )}

      {children.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-20 text-center">
          <p className="text-gray-400 text-sm">Contactez l&apos;administration pour associer vos enfants à votre compte.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {children.map((child: any) => (
            <Link
              key={child.id}
              href={`/parent/children/${child.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-sm transition group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center
                                text-purple-700 font-bold text-lg flex-shrink-0">
                  {child.first_name[0]}{child.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900 group-hover:text-purple-700 transition truncate">
                    {child.first_name} {child.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {child.class_name ?? 'Classe non assignée'}
                    {child.year_name ? ` · ${child.year_name}` : ''}
                  </p>
                </div>
                {child.relation && (
                  <span className="text-xs bg-purple-50 text-purple-600 font-medium px-2 py-0.5 rounded-full border border-purple-200 flex-shrink-0">
                    {child.relation}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>N° {child.student_number ?? '—'}</span>
                <span className="text-purple-600 font-medium group-hover:underline">
                  Voir le détail →
                </span>
              </div>
            </Link>
          ))}
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
              <AnnouncementItem key={a.id} title={a.title} content={a.content} createdAt={a.created_at} isPinned={a.is_pinned} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
