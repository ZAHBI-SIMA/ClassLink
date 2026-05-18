import { getParentById, getStudentsNotLinkedToParent } from '@/actions/admin'
import { ResetParentPasswordForm } from './reset-password-form'
import { LinkStudentForm } from './link-student-form'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, getInitials } from '@/lib/utils'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ParentDetailPage({ params }: Props) {
  const { id } = await params
  const [parent, available] = await Promise.all([
    getParentById(id),
    getStudentsNotLinkedToParent(id),
  ])
  if (!parent) notFound()

  const children: any[] = Array.isArray(parent.children) ? parent.children.filter(Boolean) : []

  return (
    <div className="max-w-2xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/parents" className="hover:text-blue-600">Parents & Tuteurs</Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">{parent.first_name} {parent.last_name}</span>
      </div>

      {/* Profil */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center
                          text-purple-700 font-bold text-2xl flex-shrink-0">
            {getInitials(parent.first_name, parent.last_name)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">
              {parent.first_name} {parent.last_name}
            </h1>
            <p className="text-sm text-gray-500">{parent.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                parent.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {parent.is_active ? 'Actif' : 'Inactif'}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                {children.length} enfant{children.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Téléphone</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{parent.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Inscrit le</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {parent.created_at ? formatDate(parent.created_at) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Gestion des enfants — lier / délier */}
      <LinkStudentForm
        parentId={id}
        available={available as any[]}
        linked={children}
      />

      {/* Réinitialisation mot de passe */}
      <ResetParentPasswordForm userId={parent.user_id} />
    </div>
  )
}
