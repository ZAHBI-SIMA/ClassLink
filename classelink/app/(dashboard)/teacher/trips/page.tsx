import { getFieldTrips } from '@/actions/trips'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'

export const metadata = { title: 'Sorties scolaires — MyClassLink' }

const STATUS_LABEL: Record<string, string> = {
  PLANNED:   'Planifiée',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  DONE:      'Terminée',
}

const STATUS_COLOR: Record<string, string> = {
  PLANNED:   'bg-yellow-50 text-yellow-700 border-yellow-100',
  CONFIRMED: 'bg-green-50 text-green-700 border-green-100',
  CANCELLED: 'bg-red-50 text-red-600 border-red-100',
  DONE:      'bg-gray-50 text-gray-500 border-gray-100',
}

function formatDate(d: string | Date | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

export default async function TeacherTripsPage() {
  const trips = await getFieldTrips()

  // N'afficher que les sorties planifiées ou confirmées
  const active = trips.filter(t =>
    t.status === 'PLANNED' || t.status === 'CONFIRMED'
  )

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Sorties scolaires"
        description="Sorties planifiées et confirmées pour vos classes."
      />

      {active.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-400">Aucune sortie scolaire planifiée pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((trip) => (
            <div
              key={trip.id}
              className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between gap-4 hover:shadow-sm transition"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLOR[trip.status] ?? 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                    {STATUS_LABEL[trip.status] ?? trip.status}
                  </span>
                  {trip.cost > 0 && (
                    <span className="text-xs text-gray-400">
                      {Number(trip.cost).toLocaleString('fr-FR')} FCFA
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 text-sm truncate">{trip.title}</h3>

                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                  {/* Destination */}
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {trip.destination}
                  </span>

                  {/* Date */}
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(trip.trip_date)}
                  </span>

                  {/* Autorisations */}
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                    </svg>
                    {trip.authorized_count ?? 0} autorisé{(trip.authorized_count ?? 0) > 1 ? 's' : ''}
                    {trip.total_students > 0 && ` / ${trip.total_students}`}
                  </span>
                </div>
              </div>

              <Link
                href={`/admin/trips/${trip.id}`}
                className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700
                           bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition whitespace-nowrap"
              >
                Voir la liste
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Sorties passées (repliées) */}
      {trips.filter(t => t.status === 'DONE' || t.status === 'CANCELLED').length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 font-medium select-none">
            Voir les sorties terminées / annulées (
            {trips.filter(t => t.status === 'DONE' || t.status === 'CANCELLED').length})
          </summary>
          <div className="mt-3 space-y-3">
            {trips
              .filter(t => t.status === 'DONE' || t.status === 'CANCELLED')
              .map(trip => (
                <div
                  key={trip.id}
                  className="bg-gray-50 rounded-xl border border-gray-100 p-5 flex items-start justify-between gap-4 opacity-70"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLOR[trip.status] ?? 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                        {STATUS_LABEL[trip.status] ?? trip.status}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-700 text-sm">{trip.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {trip.destination} · {formatDate(trip.trip_date)}
                    </p>
                  </div>
                  <Link
                    href={`/admin/trips/${trip.id}`}
                    className="shrink-0 text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition"
                  >
                    Détails
                  </Link>
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  )
}
