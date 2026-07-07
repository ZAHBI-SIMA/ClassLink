import { getPlans } from '@/actions/super-admin'
import { PageHeader } from '@/components/ui/page-header'
import { PlansClient } from './plans-client'

export default async function PlansPage() {
  const plans = await getPlans()
  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans tarifaires"
        description="Gérez les offres d'abonnement de la plateforme MyClassLink"
      />
      <PlansClient plans={plans} />
    </div>
  )
}
