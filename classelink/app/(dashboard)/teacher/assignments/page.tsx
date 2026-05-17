import {
  getTeacherAssignmentList,
  getAssignmentSubmissions,
  deleteAssignment,
  getTeacherSubjectsAndClasses,
} from '@/actions/assignments'
import { CreateAssignmentForm } from './create-form'
import { GradeForm } from './grade-form'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ tab?: string; assignmentId?: string }>
}

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function formatDate(d: string | Date | null): string {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleDateString('fr-FR', {
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

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  SUBMITTED: { label: 'Rendu',   cls: 'bg-blue-100 text-blue-700' },
  GRADED:    { label: 'Corrigé', cls: 'bg-green-100 text-green-700' },
  LATE:      { label: 'En retard', cls: 'bg-orange-100 text-orange-700' },
}

async function DeleteButton({ id }: { id: string }) {
  async function doDelete() {
    'use server'
    await deleteAssignment(id)
  }
  return (
    <form action={doDelete}>
      <button
        type="submit"
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200
                   hover:bg-red-50 transition"
      >
        Supprimer
      </button>
    </form>
  )
}

export default async function TeacherAssignmentsPage({ searchParams }: Props) {
  const params      = await searchParams
  const tab         = params.tab ?? 'list'
  const assignmentId = params.assignmentId ?? ''

  const [assignments, tscList] = await Promise.all([
    getTeacherAssignmentList(),
    getTeacherSubjectsAndClasses(),
  ])

  const { assignment: selectedAssignment, submissions } = assignmentId
    ? await getAssignmentSubmissions(assignmentId)
    : { assignment: null, submissions: [] }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Devoirs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gérez vos devoirs, consultez les rendus et notez vos élèves.
        </p>
      </div>

      {/* Formulaire de création */}
      {tscList.length > 0 ? (
        <CreateAssignmentForm tscList={tscList} />
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          Aucune attribution classe / matière trouvée pour l&apos;année en cours.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <Link
          href="/teacher/assignments?tab=list"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === 'list'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Mes devoirs
        </Link>
        <Link
          href={`/teacher/assignments?tab=grade${assignmentId ? `&assignmentId=${assignmentId}` : ''}`}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            tab === 'grade'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Corriger les rendus
        </Link>
      </div>

      {/* Tab : Mes devoirs */}
      {tab === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {assignments.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-400">Aucun devoir créé pour le moment.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Titre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Classe</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Matière</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Date limite</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Rendus</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignments.map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{a.title}</p>
                      {a.description && (
                        <p className="text-xs text-gray-400 truncate max-w-xs">{a.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.class_name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs rounded px-2 py-0.5">
                        {a.subject_code ?? a.subject_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs ${isOverdue(a.due_date) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {formatDate(a.due_date)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-semibold text-gray-900">
                        {a.submission_count}
                      </span>
                      <span className="text-xs text-gray-400"> / {a.total_students}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/teacher/assignments?tab=grade&assignmentId=${a.id}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 border border-blue-200
                                     hover:bg-blue-50 transition"
                        >
                          Voir rendus
                        </Link>
                        <DeleteButton id={a.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab : Corriger */}
      {tab === 'grade' && (
        <div className="space-y-4">
          {!assignmentId ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
              <p className="text-sm text-gray-400">
                Sélectionnez un devoir dans &quot;Mes devoirs&quot; pour voir les rendus.
              </p>
            </div>
          ) : !selectedAssignment ? (
            <div className="bg-white rounded-xl border border-gray-200 py-12 text-center">
              <p className="text-sm text-gray-400">Devoir introuvable ou accès refusé.</p>
            </div>
          ) : (
            <>
              {/* En-tête du devoir sélectionné */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">{selectedAssignment.title}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedAssignment.class_name} · {selectedAssignment.subject_name} · Note max : {selectedAssignment.max_score}
                    {' · '}Date limite : {formatDate(selectedAssignment.due_date)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {submissions.filter((s: any) => s.submission_id).length}
                  <span className="text-gray-400 font-normal"> / {submissions.length} rendus</span>
                </span>
              </div>

              {/* Tableau des rendus */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Élève</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contenu rendu</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Note actuelle</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Notation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {submissions.map((s: any) => {
                      const submitted = !!s.submission_id
                      const filesText = s.files?.text ?? null
                      const statusInfo = s.status ? STATUS_LABELS[s.status] : null

                      return (
                        <tr key={s.student_id} className="hover:bg-gray-50 transition align-top">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs
                                              font-bold flex items-center justify-center flex-shrink-0">
                                {s.first_name?.[0]}{s.last_name?.[0]}
                              </div>
                              <span className="font-medium text-gray-900">
                                {s.last_name} {s.first_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {submitted && statusInfo ? (
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.cls}`}>
                                {statusInfo.label}
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                Non rendu
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            {filesText ? (
                              <p className="text-sm text-gray-700 line-clamp-3">{filesText}</p>
                            ) : submitted ? (
                              <span className="text-xs text-gray-400 italic">Fichier joint</span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {s.score !== null && s.score !== undefined ? (
                              <span className={`inline-block px-2.5 py-1 rounded-lg text-sm font-bold ${
                                parseFloat(s.score) >= selectedAssignment.max_score / 2
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {parseFloat(s.score).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {submitted ? (
                              <GradeForm
                                submissionId={s.submission_id}
                                assignmentId={assignmentId}
                                currentScore={s.score ? parseFloat(s.score) : null}
                                maxScore={selectedAssignment.max_score}
                              />
                            ) : (
                              <span className="text-xs text-gray-300">Pas de rendu</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
