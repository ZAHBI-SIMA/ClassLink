import { getParentTrips } from '@/actions/trips'
import { TripsClient } from './trips-client'

export default async function ParentTripsPage() {
  const trips = await getParentTrips()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sorties scolaires</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gérez les autorisations de sorties scolaires pour vos enfants.
        </p>
      </div>

      <TripsClient trips={trips} />
    </div>
  )
}
