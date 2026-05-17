import { getStudentAssignments } from '@/actions/assignments'
import { SubmitAssignmentForm } from './submit-form'

function formatDate(d: string | Date | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isOverdue(d: string | Date | null): boolean {
  if (!d) return false
  return new Date(d) < new Date()
}

interface StatusBadgeProps {
  submissionStatus: string | null
  dueDate: string | Date | null
}

function StatusBadge({ submissionStatus, dueDate }: StatusBadgeProps) {
  if (!submissionStatus) {
    if (isOverdue(dueDate)) {
      return (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
          Non rendu (en retard)
        </span>
      )
    }
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        A faire
      </span>
    )
  }

  const MAP: Record<string, { label: string; cls: string }> = {
    SUBMITTED: { label: 'Rendu',    cls: 'bg-blue-100 text-blue-700' },
    GRADED:    { label: 'Corrige',  cls: 'bg-green-100 text-green-700' },
    LATE:      { label: 'En retard', cls: 'bg-orange-100 text-orange-700' },
  }
  const info = MAP[submissionStatus] ?? { label: submissionStatus, cls: 'bg-gray-100 text-gray-600' }

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${info.cls}`}>
      {info.label}
    </span>
  )
}

export default async function StudentAssignmentsPage() {
  const assignments = await getStudentAssignments()

  const todo    = assignments.filter((a: any) => !a.submission_id && !isOverdue(a.due_date))
  const pending = assignments.filter((a: any) => a.submission_id && a.submission_status !== 'GRADED')
  const graded  = assignments.filter((a: any) => a.submission_status === 'GRADED')
  const missed  = assignments.filter((a: any) => !a.submission_id && isOverdue(a.due_date))

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes devoirs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Consultez vos devoirs, rendez-les et suivez vos corrections.
        </p>
      </div>

      {assignments.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm text-gray-400">Aucun devoir pour le moment.</p>
        </div>
      )}

      {/* Section : A faire */}
      {todo.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">
            A faire
            <span className="ml-2 text-sm font-normal text-gray-400">({todo.length})</span>
          </h2>
          <div className="space-y-3">
            {todo.map((a: any) => (
              <AssignmentCard key={a.id} assignment={a} showSubmitForm />
            ))}
          </div>
        </section>
      )}

      {/* Section : Rendus en attente de correction */}
      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">
            Rendus — en attente de correction
            <span className="ml-2 text-sm font-normal text-gray-400">({pending.length})</span>
          </h2>
          <div className="space-y-3">
            {pending.map((a: any) => (
              <AssignmentCard key={a.id} assignment={a} />
            ))}
          </div>
        </section>
      )}

      {/* Section : Corrigés */}
      {graded.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">
            Corrigés
            <span className="ml-2 text-sm font-normal text-gray-400">({graded.length})</span>
          </h2>
          <div className="space-y-3">
            {graded.map((a: any) => (
              <AssignmentCard key={a.id} assignment={a} />
            ))}
          </div>
        </section>
      )}

      {/* Section : Non rendus (en retard) */}
      {missed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900 text-red-600">
            Non rendus
            <span className="ml-2 text-sm font-normal text-gray-400">({missed.length})</span>
          </h2>
          <div className="space-y-3">
            {missed.map((a: any) => (
              <AssignmentCard key={a.id} assignment={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function AssignmentCard({
  assignment: a,
  showSubmitForm = false,
}: {
  assignment: any
  showSubmitForm?: boolean
}) {
  const overdue = isOverdue(a.due_date)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Matière + titre */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-block bg-gray-100 text-gray-600 text-xs rounded px-2 py-0.5 font-medium">
              {a.subject_code ?? a.subject_name}
            </span>
            <StatusBadge submissionStatus={a.submission_status} dueDate={a.due_date} />
          </div>

          <h3 className="text-sm font-semibold text-gray-900 mt-1">{a.title}</h3>

          {a.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.description}</p>
          )}

          <p className="text-xs text-gray-400 mt-2">
            Enseignant : {a.teacher_last} {a.teacher_first}
          </p>
        </div>

        <div className="flex-shrink-0 text-right space-y-1">
          <p className={`text-xs font-medium ${overdue ? 'text-red-600' : 'text-gray-600'}`}>
            {overdue ? 'Expiré le' : 'Avant le'}
          </p>
          <p className={`text-xs ${overdue ? 'text-red-500' : 'text-gray-500'}`}>
            {formatDate(a.due_date)}
          </p>
          <p className="text-xs text-gray-400">Note max : {a.max_score}</p>
        </div>
      </div>

      {/* Note obtenue */}
      {a.submission_status === 'GRADED' && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold ${
              parseFloat(a.score) >= a.max_score / 2 ? 'text-green-600' : 'text-red-600'
            }`}>
              {parseFloat(a.score).toFixed(2)} / {a.max_score}
            </span>
          </div>
          {a.feedback && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              <span className="font-medium text-gray-700">Appreciation : </span>
              {a.feedback}
            </p>
          )}
        </div>
      )}

      {/* Contenu soumis (si rendu) */}
      {a.submission_id && a.files?.text && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-1">Votre rendu :</p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 line-clamp-4">
            {a.files.text}
          </p>
          {a.submitted_at && (
            <p className="text-xs text-gray-400 mt-1">
              Soumis le {formatDate(a.submitted_at)}
            </p>
          )}
        </div>
      )}

      {/* Formulaire de rendu */}
      {showSubmitForm && (
        <SubmitAssignmentForm
          assignmentId={a.id}
          title={a.title}
          maxScore={a.max_score}
        />
      )}
    </div>
  )
}
