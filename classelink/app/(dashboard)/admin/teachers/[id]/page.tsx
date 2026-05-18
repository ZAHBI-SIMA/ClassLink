import { notFound } from 'next/navigation'
import { getTeacherById, getSubjects, getClasses } from '@/actions/admin'
import { ResetPasswordForm } from './reset-password-form'
import { AssignClassForm } from './assign-class-form'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TeacherDetailPage({ params }: Props) {
  const { id } = await params
  const [teacher, subjects, classes] = await Promise.all([
    getTeacherById(id),
    getSubjects(),
    getClasses(),
  ])

  if (!teacher) notFound()

  const initials = `${teacher.first_name[0]}${teacher.last_name[0]}`.toUpperCase()
  const assignments: any[] = (teacher.assignments ?? []).filter(Boolean)

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/teachers" className="text-gray-400 hover:text-gray-600">
          Enseignants
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-medium">
          {teacher.first_name} {teacher.last_name}
        </span>
      </div>

      {/* En-tête */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center
                          text-blue-700 font-bold text-2xl flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {teacher.first_name} {teacher.last_name}
                </h1>
                <p className="text-sm text-gray-500">{teacher.email}</p>
                {teacher.specialty && (
                  <p className="text-sm text-blue-600 font-medium mt-0.5">{teacher.specialty}</p>
                )}
              </div>
              <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
                teacher.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {teacher.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
              {teacher.phone && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {teacher.phone}
                </span>
              )}
              {teacher.employee_id && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
                  </svg>
                  Matricule : {teacher.employee_id}
                </span>
              )}
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Inscrit le {formatDate(teacher.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Activité (année en cours)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{teacher.class_count}</p>
              <p className="text-xs text-gray-500 mt-1">Classe{teacher.class_count !== 1 ? 's' : ''}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{teacher.subject_count}</p>
              <p className="text-xs text-gray-500 mt-1">Matière{teacher.subject_count !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Réinitialisation mot de passe */}
        <ResetPasswordForm userId={teacher.user_id} />
      </div>

      {/* Attributions classes / matières avec formulaire */}
      <AssignClassForm
        teacherId={id}
        assignments={assignments}
        subjects={subjects as any[]}
        classes={classes as any[]}
      />
    </div>
  )
}
