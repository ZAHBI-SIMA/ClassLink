import { getTripDetails, getTripAuthorizations, updateTripStatus } from '@/actions/trips'
import { PageHeader } from '@/components/ui/page-header'
import { PrintButton } from './print-button'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PLANNED:   { label: 'Planifiée',  cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  CONFIRMED: { label: 'Confirmée', cls: 'bg-green-100 text-green-700 border-green-200' },
  COMPLETED: { label: 'Terminée',  cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  CANCELLED: { label: 'Annulée',   cls: 'bg-red-100 text-red-700 border-red-200' },
}

const AUTH_CFG: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: 'En attente', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  AUTHORIZED: { label: 'Autorisé',  cls: 'bg-green-100 text-green-700 border-green-200' },
  REFUSED:    { label: 'Refusé',    cls: 'bg-red-100 text-red-700 border-red-200' },
}

const STATUS_NEXT: Record<string, { label: string; next: string }> = {
  PLANNED:   { label: 'Confirmer la sortie',  next: 'CONFIRMED' },
  CONFIRMED: { label: 'Marquer comme terminé', next: 'COMPLETED' },
}

function formatDate(d: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatDateTime(d: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function TripDetailPage({ params }: Props) {
  const { id } = await params
  const [{ trip, classes, students }, authorizations] = await Promise.all([
    getTripDetails(id),
    getTripAuthorizations(id),
  ])

  if (!trip) notFound()

  const cfg = STATUS_CFG[trip.status] ?? STATUS_CFG.PLANNED
  const nextAction = STATUS_NEXT[trip.status]

  const authorized = authorizations.filter((a: any) => a.status === 'AUTHORIZED').length
  const pending    = authorizations.filter((a: any) => a.status === 'PENDING').length
  const refused    = authorizations.filter((a: any) => a.status === 'REFUSED').length
  const total      = authorizations.length

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/trips" className="hover:text-blue-600 transition">Sorties</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium truncate">{trip.title}</span>
      </nav>

      <PageHeader
        title={trip.title}
        description={trip.description ?? undefined}
        action={
          <div className="flex items-center gap-2">
            {nextAction && (
              <form action={async () => {
                'use server'
                await updateTripStatus(id, nextAction.next)
              }}>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                >
                  {nextAction.label}
                </button>
              </form>
            )}
            <PrintButton />
          </div>
        }
      />

      {/* Fiche sortie */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Destination</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{trip.destination}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date de sortie</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(trip.trip_date)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Coût</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {trip.cost > 0 ? `${Number(trip.cost).toLocaleString('fr-FR')} FCFA` : 'Gratuit'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Statut</p>
            <span className={`mt-1 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
              {cfg.label}
            </span>
          </div>
          {trip.departure_time && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Heure de départ</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{trip.departure_time}</p>
            </div>
          )}
          {trip.return_date && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date de retour</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(trip.return_date)}</p>
            </div>
          )}
          {classes.length > 0 && (
            <div className="col-span-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Classes concernées</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {classes.map((c: any) => (
                  <span key={c.id} className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {c.class_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats autorisations */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Autorisés',  value: authorized, color: 'green' },
          { label: 'En attente', value: pending,    color: 'yellow' },
          { label: 'Refusés',    value: refused,    color: 'red' },
          { label: 'Total',      value: total,      color: 'blue' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 text-${color}-600`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tableau des autorisations */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Autorisations parentales</h3>
        </div>
        {authorizations.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Aucune autorisation enregistrée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Élève', 'Classe', 'Parent', 'Téléphone', 'Statut', 'Date signature'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {authorizations.map((a: any) => {
                  const authCfg = AUTH_CFG[a.status] ?? AUTH_CFG.PENDING
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {a.student_last_name} {a.student_first_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{a.class_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{a.parent_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{a.parent_phone ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${authCfg.cls}`}>
                          {authCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(a.signed_at)}</td>
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
