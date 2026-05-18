import { getSubscriptions, getSubscriptionStats, getPlans } from '@/actions/super-admin'
import { PageHeader } from '@/components/ui/page-header'
import { SubscriptionsClient } from './subscriptions-client'

interface Props {
  searchParams: Promise<{ page?: string; status?: string; planId?: string; search?: string }>
}

export default async function SubscriptionsPage({ searchParams }: Props) {
  const params = await searchParams

  const [result, stats, plans] = await Promise.all([
    getSubscriptions({
      page:   params.page ? parseInt(params.page) : 1,
      status: params.status,
      planId: params.planId,
      search: params.search,
    }),
    getSubscriptionStats(),
    getPlans(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abonnements"
        description={`${result.total} abonnement${result.total > 1 ? 's' : ''} enregistré${result.total > 1 ? 's' : ''}`}
      />
      <SubscriptionsClient
        result={result}
        stats={stats}
        plans={plans}
        currentFilters={params}
      />
    </div>
  )
}
