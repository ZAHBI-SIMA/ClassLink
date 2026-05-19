import { getResources, getResourceBookings } from '@/actions/resources'
import { PageHeader } from '@/components/ui/page-header'
import { ResourceModal } from './resource-modal'
import { BookingModal } from './booking-modal'

const TYPE_CFG: Record<string, { label: string; cls: string }> = {
  ROOM:      { label: 'Salle',       cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  EQUIPMENT: { label: 'Équipement',  cls: 'bg-purple-100 text-purple-700 border-purple-200' },
  VEHICLE:   { label: 'Véhicule',    cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  OTHER:     { label: 'Autre',       cls: 'bg-gray-100 text-gray-700 border-gray-200' },
}

function fmt(t: string | null) {
  if (!t) return '—'
  return t.slice(0, 5)
}

interface Props {
  searchParams: Promise<{ type?: string; date?: string }>
}

export default async function ResourcesPage({ searchParams }: Props) {
  const params = await searchParams
  const typeFilter = params.type ?? undefined
  const dateFilter = params.date ?? new Date().toISOString().split('T')[0]

  const [resources, bookings] = await Promise.all([
    getResources(typeFilter),
    getResourceBookings(undefined, dateFilter),
  ])

  const totalResources  = resources.length
  const totalBookings   = bookings.length
  const availableCount  = resources.filter((r: any) => Number(r.active_bookings_today) === 0).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ressources & Salles"
        description="Gestion des ressources et réservations"
        action={<ResourceModal />}
      />

      {/* Filtres */}
      <form method="GET" className="flex flex-wrap gap-3">
        <select
          name="type"
          defaultValue={typeFilter ?? ''}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les types</option>
          <option value="ROOM">Salle</option>
          <option value="EQUIPMENT">Équipement</option>
          <option value="VEHICLE">Véhicule</option>
          <option value="OTHER">Autre</option>
        </select>
        <input
          name="date"
          type="date"
          defaultValue={dateFilter}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition"
        >
          Filtrer
        </button>
        {(typeFilter || params.date) && (
          <a
            href="/admin/resources"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
          >
            Réinitialiser
          </a>
        )}
      </form>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total ressources',          value: totalResources,  color: 'blue' },
          { label: 'Réservations aujourd\'hui', value: totalBookings,   color: 'orange' },
          { label: 'Disponibles',               value: availableCount,  color: 'green' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 text-${color}-600`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Grille ressources */}
      {resources.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-500 font-medium">Aucune ressource trouvée</p>
          <p className="text-sm text-gray-400 mt-1">Ajoutez votre première ressource.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource: any) => {
            const cfg = TYPE_CFG[resource.type] ?? TYPE_CFG.OTHER
            const todayBookings = bookings.filter((b: any) => b.resource_name === resource.name)
            return (
              <div key={resource.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{resource.name}</h3>
                    {resource.location && (
                      <p className="text-xs text-gray-500 mt-0.5">{resource.location}</p>
                    )}
                  </div>
                  <span className={`ml-2 flex-shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-600">
                  {resource.capacity > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {resource.capacity} places
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {Number(resource.active_bookings_today)} résa. aujourd'hui
                  </span>
                </div>

                {resource.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{resource.description}</p>
                )}

                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                  <BookingModal
                    resources={resources.map((r: any) => ({ id: r.id, name: r.name, type: r.type }))}
                    preselectedId={resource.id}
                  />
                  <a
                    href={`/admin/resources/${resource.id}/edit`}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
                  >
                    Modifier
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Réservations du jour */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">
            Réservations du {new Date(dateFilter + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
        </div>
        {bookings.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Aucune réservation pour cette date.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Début', 'Fin', 'Ressource', 'Demandeur', 'Objet', 'Statut'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{fmt(b.start_time)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{fmt(b.end_time)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.resource_name}</td>
                    <td className="px-4 py-3 text-gray-600">{b.booked_by_name}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{b.purpose ?? b.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                        b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 border-green-200' :
                        b.status === 'CANCELLED' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }`}>
                        {b.status === 'CONFIRMED' ? 'Confirmée' : b.status === 'CANCELLED' ? 'Annulée' : 'En attente'}
                      </span>
                    </td>
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
