import { getResources, getResourceBookings } from '@/actions/resources'
import { PageHeader } from '@/components/ui/page-header'
import { ResourcesClient } from './resources-client'

export const metadata = { title: 'Réservation de ressources — MyClassLink' }

export default async function TeacherResourcesPage() {
  const todayStr = new Date().toISOString().split('T')[0]

  const [resources, bookings] = await Promise.all([
    getResources(),
    getResourceBookings(undefined, todayStr),
  ])

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Réservation de ressources"
        description="Consultez les salles et équipements disponibles et effectuez vos réservations."
      />
      <ResourcesClient resources={resources} bookings={bookings} />
    </div>
  )
}
