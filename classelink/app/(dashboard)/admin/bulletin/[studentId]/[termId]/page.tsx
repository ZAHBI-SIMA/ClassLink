import { getBulletinData } from '@/actions/bulletin'
import { BulletinView } from '@/components/bulletin/bulletin-view'
import { PrintButton } from './print-button'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ studentId: string; termId: string }>
}

export default async function BulletinDetailPage({ params }: Props) {
  const { studentId, termId } = await params
  const result = await getBulletinData(studentId, termId)

  if (!result.success || !result.data) notFound()

  const { student, term } = result.data

  return (
    <>
      {/* Barre d'outils — masquée à l'impression */}
      <div className="flex items-center justify-between mb-6 print:hidden no-print">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/admin/bulletin" className="hover:text-blue-600">
            Bulletins
          </Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">
            {student.last_name?.toUpperCase()} {student.first_name} — {term?.name}
          </span>
        </div>
        <PrintButton />
      </div>

      {/* ════════════════ BULLETIN IMPRIMABLE ════════════════ */}
      <BulletinView data={result.data} />

      {/* Styles d'impression */}
      <style>{`@media print { .no-print { display: none; } }`}</style>
    </>
  )
}
