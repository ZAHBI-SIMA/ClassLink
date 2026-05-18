import { getCouncilDetails } from '@/actions/council'
import { PageHeader } from '@/components/ui/page-header'
import { CouncilBoard } from './council-board'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CouncilDetailPage({ params }: Props) {
  const { id } = await params
  const { council, students } = await getCouncilDetails(id)

  if (!council) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Conseil · ${council.class_name} · ${council.term_name}`}
        description={`Année ${council.academic_year_name ?? ''} · ${students.length} élève${students.length > 1 ? 's' : ''}`}
        action={
          <Link href="/admin/councils"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition">
            ← Tous les conseils
          </Link>
        }
      />
      <CouncilBoard councilId={id} council={council} students={students} />
    </div>
  )
}
