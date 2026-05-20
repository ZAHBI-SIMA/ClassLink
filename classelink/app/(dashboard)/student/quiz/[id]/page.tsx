import { getQuizWithQuestions } from '@/actions/student-quiz'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: 'Détail du quiz' }

export default async function QuizDetailPage({ params }: Props) {
  const { id } = await params
  const result = await getQuizWithQuestions(id)
  if (!result.success || !result.data) notFound()

  const { quiz, questions, attempts } = result.data
  const lastAttempt = attempts[0] ?? null
  const isCompleted = lastAttempt?.status === 'SUBMITTED'
  const percentage = isCompleted && lastAttempt.max_score
    ? Math.round((parseFloat(lastAttempt.score) / parseFloat(lastAttempt.max_score)) * 100)
    : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/student/quiz" className="hover:text-purple-600">Quiz & QCM</Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">{quiz.title}</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-sm text-gray-600 mb-4">{quiz.description}</p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
          </div>
          {quiz.time_limit && (
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{quiz.time_limit} minutes</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{quiz.max_attempts ?? 1} tentative{(quiz.max_attempts ?? 1) !== 1 ? 's' : ''} max</span>
          </div>
        </div>

        {isCompleted ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl ${percentage !== null && percentage >= 80 ? 'bg-green-50 border border-green-200' : percentage !== null && percentage >= 50 ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {percentage !== null && percentage >= 80 ? '🏆' : percentage !== null && percentage >= 50 ? '👍' : '📚'}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Quiz terminé</p>
                  <p className="text-lg font-bold text-gray-900">
                    {parseFloat(lastAttempt.score).toFixed(1)} / {parseFloat(lastAttempt.max_score).toFixed(1)} pts
                    {percentage !== null && (
                      <span className="ml-2 text-sm font-normal text-gray-500">({percentage}%)</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <Link href="/student/quiz"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700
                         text-sm font-medium rounded-lg hover:bg-gray-50 transition">
              ← Retour aux quiz
            </Link>
          </div>
        ) : (
          <Link
            href={`/student/quiz/${id}/take`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3
                       bg-purple-600 hover:bg-purple-700 text-white font-semibold
                       rounded-xl transition text-sm"
          >
            {lastAttempt?.status === 'IN_PROGRESS' ? 'Continuer le quiz' : 'Commencer le quiz'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  )
}
