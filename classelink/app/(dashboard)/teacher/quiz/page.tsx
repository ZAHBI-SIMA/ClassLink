import { getMyCreatedQuizzes, createQuizForm, toggleQuizPublish } from '@/actions/quiz-admin'
import { getTeacherClassesWithSubjects, getTeacherTerms } from '@/actions/teacher'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'

export const metadata = { title: 'Quiz & QCM' }

export default async function TeacherQuizPage() {
  const [quizzes, assignments, terms] = await Promise.all([
    getMyCreatedQuizzes(),
    getTeacherClassesWithSubjects(),
    getTeacherTerms(),
  ])

  const classes = [...new Map(assignments.map((a: any) => [a.class_id, { id: a.class_id, name: a.class_name }])).values()]
  const allSubjects = [...new Map(assignments.map((a: any) => [a.subject_id, { id: a.subject_id, name: a.subject_name }])).values()]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quiz & QCM"
        description="Créez et gérez des quiz interactifs pour vos élèves."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create form */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Nouveau quiz</h3>
          <form action={createQuizForm as any} className="space-y-3">
            <input name="title" required placeholder="Titre du quiz"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <textarea name="description" rows={2} placeholder="Description (optionnel)"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <select name="classId"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Toutes les classes</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select name="subjectId"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Matière (optionnel)</option>
              {allSubjects.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Durée (min, opt.)</label>
                <input name="timeLimitMin" type="number" min={1} placeholder="30"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Tentatives max</label>
                <input name="maxAttempts" type="number" min={1} defaultValue={1}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">Date limite (opt.)</label>
              <input name="dueDate" type="datetime-local"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
              Créer le quiz
            </button>
          </form>
        </div>

        {/* Quiz list */}
        <div className="lg:col-span-2 space-y-3">
          {quizzes.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-gray-700 font-medium">Aucun quiz créé</p>
              <p className="text-sm text-gray-400 mt-1">Créez votre premier quiz pour vos élèves.</p>
            </div>
          ) : (
            quizzes.map((q: any) => (
              <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="text-sm font-semibold text-gray-900">{q.title}</h4>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                        ${q.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {q.is_published ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      {q.class_name && <span>{q.class_name}</span>}
                      {q.subject_name && <span>· {q.subject_name}</span>}
                      <span>· {q.question_count} question{q.question_count !== 1 ? 's' : ''}</span>
                      <span>· {q.attempt_count} tentative{q.attempt_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/teacher/quiz/${q.id}`}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200
                                 rounded-lg hover:bg-blue-50 transition">
                      Gérer
                    </Link>
                    <form action={toggleQuizPublish.bind(null, q.id) as any}>
                      <button type="submit"
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition
                          ${q.is_published
                            ? 'text-gray-600 border-gray-200 hover:bg-gray-50'
                            : 'text-green-600 border-green-200 hover:bg-green-50'}`}>
                        {q.is_published ? 'Dépublier' : 'Publier'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
