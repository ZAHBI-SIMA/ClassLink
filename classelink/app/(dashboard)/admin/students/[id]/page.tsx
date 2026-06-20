import { getStudentById, getClasses } from '@/actions/admin'
import { ResetStudentPasswordForm } from './reset-password-form'
import { StudentActions } from './student-actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Props {
  params: Promise<{ id: string }>
}

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params
  const [student, allClasses] = await Promise.all([
    getStudentById(id),
    getClasses(),
  ])
  if (!student) notFound()

  const initials = `${student.first_name[0]}${student.last_name[0]}`
  const fullName = `${student.first_name} ${student.last_name}`

  // Classe courante dérivée de getStudentById (class_name) — on cherche l'id dans allClasses
  const currentClass = student.class_name
    ? (allClasses as any[]).find((c: any) => c.name === student.class_name)
      ? { id: (allClasses as any[]).find((c: any) => c.name === student.class_name).id, name: student.class_name }
      : null
    : null

  return (
    <div className="max-w-2xl space-y-5">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/admin/students" className="hover:text-blue-600">Élèves</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">{fullName}</span>
        </div>
        <Link
          href={`/admin/bulletin/${id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700
                     text-white text-xs font-medium rounded-lg transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Bulletin
        </Link>
      </div>

      {/* Profil */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center
                          text-green-700 font-bold text-2xl flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
            <p className="text-sm text-gray-500">{student.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                student.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {student.is_active ? 'Actif' : 'Inactif'}
              </span>
              {student.class_name && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {student.class_name}
                </span>
              )}
              {student.gender && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  {student.gender === 'M' ? 'Masculin' : 'Féminin'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">N° élève</p>
            <p className="text-sm font-semibold text-gray-900 font-mono mt-0.5">{student.student_number ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Téléphone</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{student.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Date de naissance</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {student.date_of_birth ? formatDate(student.date_of_birth) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Adresse</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{student.address ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Classe</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{student.class_name ?? 'Non affecté'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Inscrit le</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {student.created_at ? formatDate(student.created_at) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Gestion classe + suppression */}
      <StudentActions
        studentId={id}
        studentName={fullName}
        currentClass={currentClass}
        classes={(allClasses as any[]).map((c: any) => ({
          id:         c.id,
          name:       c.name,
          level_name: c.level_name,
        }))}
      />

      {/* Réinitialisation mot de passe */}
      <ResetStudentPasswordForm userId={student.user_id} />
    </div>
  )
}
