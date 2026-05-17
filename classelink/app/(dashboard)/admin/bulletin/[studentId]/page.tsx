import { getStudentById, getTerms } from '@/actions/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ studentId: string }>
}

export default async function BulletinSelectTermPage({ params }: Props) {
  const { studentId } = await params
  const [student, terms] = await Promise.all([
    getStudentById(studentId),
    getTerms(),
  ])
  if (!student) notFound()

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/students" className="hover:text-blue-600">Élèves</Link>
        <span>›</span>
        <Link href={`/admin/students/${studentId}`} className="hover:text-blue-600">
          {student.first_name} {student.last_name}
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Bulletin</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-lg font-bold text-gray-900 mb-1">Choisir un trimestre</h1>
        <p className="text-sm text-gray-500 mb-5">
          Sélectionnez le trimestre pour générer le bulletin de{' '}
          <strong>{student.first_name} {student.last_name}</strong>.
        </p>

        {terms.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Aucun trimestre configuré pour l&apos;année en cours.</p>
        ) : (
          <div className="space-y-2">
            {terms.map((t: any) => (
              <Link
                key={t.id}
                href={`/admin/bulletin/${studentId}/${t.id}`}
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200
                           hover:border-blue-400 hover:bg-blue-50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center
                                  text-blue-700 text-xs font-bold group-hover:bg-blue-600 group-hover:text-white transition">
                    T{t.term_order}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{t.name}</span>
                </div>
                <span className="text-xs text-blue-600 font-medium group-hover:underline">Voir le bulletin →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
