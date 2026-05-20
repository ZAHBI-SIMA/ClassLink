import { getQuizForEdit, addQuestionForm, deleteQuestion } from '@/actions/quiz-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: 'Gérer le quiz' }

const Q_TYPE_LABEL: Record<string, string> = {
  MCQ: 'QCM', TRUE_FALSE: 'Vrai/Faux', SHORT: 'Réponse courte',
}

export default async function TeacherQuizDetailPage({ params }: Props) {
  const { id } = await params
  const result = await getQuizForEdit(id)
  if (!result.success || !result.data) notFound()

  const { quiz, questions } = result.data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/teacher/quiz" className="hover:text-blue-600">Quiz & QCM</Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">{quiz.title}</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-bold text-gray-900">{quiz.title}</h1>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full
            ${quiz.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {quiz.is_published ? '✓ Publié' : 'Brouillon'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {quiz.class_name && <span>{quiz.class_name}</span>}
          {quiz.subject_name && <span>· {quiz.subject_name}</span>}
          {quiz.time_limit && <span>· {quiz.time_limit} min</span>}
          <span>· {questions.length} question{questions.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add question */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Ajouter une question</h3>
          <form action={addQuestionForm as any} className="space-y-3">
            <input type="hidden" name="quizId" value={id} />
            <textarea name="question" required rows={2} placeholder="Texte de la question"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <select name="type" defaultValue="MCQ"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="MCQ">QCM (choix multiple)</option>
              <option value="TRUE_FALSE">Vrai / Faux</option>
              <option value="SHORT">Réponse courte</option>
            </select>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Options (séparées par | pour MCQ) — ex: Paris|Londres|Berlin
              </label>
              <input name="options" placeholder="Option A|Option B|Option C"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <input name="correct" required placeholder="Réponse correcte exacte"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input name="points" type="number" min={0.5} step={0.5} defaultValue={1}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
              Ajouter la question
            </button>
          </form>
        </div>

        {/* Questions list */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Questions ({questions.length})
          </h3>
          {questions.length === 0 ? (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 py-10 text-center">
              <p className="text-sm text-gray-400">Aucune question encore</p>
            </div>
          ) : (
            questions.map((q: any, i: number) => {
              const opts = q.options
                ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options)
                : []
              return (
                <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-400">Q{i + 1}</span>
                        <span className="text-xs text-gray-400">{Q_TYPE_LABEL[q.type] ?? q.type}</span>
                        <span className="text-xs text-gray-400">· {q.points} pt{q.points !== 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-sm text-gray-900 font-medium">{q.question}</p>
                      {opts.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {opts.map((o: string, j: number) => (
                            <span key={j}
                              className={`text-xs px-2 py-0.5 rounded-full border
                                ${o === q.correct
                                  ? 'bg-green-50 border-green-300 text-green-700 font-semibold'
                                  : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                              {o}
                            </span>
                          ))}
                        </div>
                      )}
                      {opts.length === 0 && (
                        <p className="text-xs text-green-600 mt-1">✓ {q.correct}</p>
                      )}
                    </div>
                    <form action={deleteQuestion.bind(null, q.id) as any}>
                      <button type="submit"
                        className="p-1.5 text-gray-300 hover:text-red-500 transition flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
