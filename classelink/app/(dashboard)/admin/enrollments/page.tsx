import { getEnrollmentApplications, getEnrollmentStats } from '@/actions/enrollment'
import { PageHeader } from '@/components/ui/page-header'
import { EnrollmentsClient } from './enrollments-client'

interface Props {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export default async function EnrollmentsPage({ searchParams }: Props) {
  const params = await searchParams

  const [result, stats] = await Promise.all([
    getEnrollmentApplications({
      status: params.status,
      search: params.search,
      page:   params.page ? parseInt(params.page) : 1,
    }),
    getEnrollmentStats(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inscriptions en ligne"
        description={`${stats.total} candidature${stats.total > 1 ? 's' : ''} reçue${stats.total > 1 ? 's' : ''}`}
      />
      <EnrollmentsClient result={result} stats={stats} currentFilters={params} />
    </div>
  )
}
