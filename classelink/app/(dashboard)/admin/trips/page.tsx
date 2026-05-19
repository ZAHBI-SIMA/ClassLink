import { getFieldTrips } from '@/actions/trips'
import { PageHeader } from '@/components/ui/page-header'
import { TripFormModal } from './trip-form'
import Link from 'next/link'
import { deleteTrip, updateTripStatus } from '@/actions/trips'

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PLANNED:   { label: 'Planifiée',  cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  CONFIRMED: { label: 'Confirmée', cls: 'bg-green-100 text-green-700 border-green-200' },
  COMPLETED: { label: 'Terminée',  cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  CANCELLED: { label: 'Annulée',   cls: 'bg-red-100 text-red-700 border-red-200' },
}

const STATUS_NEXT: Record<string, string> = {
  PLANNED:   'CONFIRMED',
  CONFIRMED: 'COMPLETED',
}

function formatDate(d: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function TripsPage({ searchParams }: Props) {
  const params = await searchParams
  const statusFilter = params.status ?? 'ALL'

  const trips = await getFieldTrips()
  const filtered = statusFilter === 'ALL'
    ? trips
    : trips.filter((t: any) => t.status === statusFilter)

  const STATUSES = ['ALL', 'PLANNED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sorties scolaires"
        description="Planification et suivi des sorties et voyages scolaires"
        action={<TripFormModal classes={[]} />}
      />

      {/* Filtres status */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => {
          const label = s === 'ALL' ? 'Tous' : (STATUS_CFG[s]?.label ?? s)
          const isActive = s === statusFilter
          return (
            <a
              key={s}
              href={s === 'ALL' ? '/admin/trips' : `/admin/trips?status=${s}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
              {s !== 'ALL' && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({trips.filter((t: any) => t.status === s).length})
                </span>
              )}
            </a>
          )
        })}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <p className="text-gray-500 font-medium">Aucune sortie scolaire</p>
          <p className="text-sm text-gray-400 mt-1">Planifiez la première sortie pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((trip: any) => {
            const cfg = STATUS_CFG[trip.status] ?? STATUS_CFG.PLANNED
            const nextStatus = STATUS_NEXT[trip.status]
            const authorized = Number(trip.authorized_count)
            const total      = Number(trip.total_students)
            const pct        = total > 0 ? Math.round((authorized / total) * 100) : 0

            return (
              <div key={trip.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{trip.title}</h3>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {trip.destination}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(trip.trip_date)}
                        {trip.return_date && trip.return_date !== trip.trip_date && ` → ${formatDate(trip.return_date)}`}
                      </span>
                      {trip.cost > 0 && (
                        <span>{Number(trip.cost).toLocaleString('fr-FR')} FCFA</span>
                      )}
                    </div>

                    {/* Barre de progression autorisations */}
                    {total > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Autorisations parentales</span>
                          <span className="font-medium">{authorized}/{total} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/admin/trips/${trip.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition"
                    >
                      Voir détails
                    </Link>

                    {nextStatus && (
                      <form action={async () => {
                        'use server'
                        await updateTripStatus(trip.id, nextStatus)
                      }}>
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-orange-600 border border-orange-200 hover:bg-orange-50 transition"
                        >
                          {nextStatus === 'CONFIRMED' ? 'Confirmer' : 'Terminer'}
                        </button>
                      </form>
                    )}

                    {trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED' && (
                      <form action={async () => {
                        'use server'
                        await updateTripStatus(trip.id, 'CANCELLED')
                      }}>
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition"
                        >
                          Annuler
                        </button>
                      </form>
                    )}

                    <form action={async () => {
                      'use server'
                      await deleteTrip(trip.id)
                    }}>
                      <button
                        type="submit"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
