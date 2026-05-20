import { getMyQuizzes } from '@/actions/student-quiz'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'

export const metadata = { title: 'Quiz & QCM' }

function statusBadge(status: string | null) {
  if (!status) return { label: 'À faire', cls: 'bg-blue-100 text-blue-800' }
  if (status === 'IN_PROGRESS') return { label: 'En cours', cls: 'bg-yellow-100 text-yellow-800' }
  return { label: 'Terminé', cls: 'bg-green-100 text-green-800' }
}

export default async function QuizPage() {
  const quizzes = await getMyQuizzes()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quiz & QCM"
        description="Testez vos connaissances et améliorez vos résultats avec des quiz interactifs."
      />

      {quizzes.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-gray-700 font-medium">Aucun quiz disponible</p>
          <p className="text-sm text-gray-400 mt-1">Vos enseignants n&apos;ont pas encore publié de quiz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((q: any) => {
            const badge = statusBadge(q.attempt_status)
            const isCompleted = q.attempt_status === 'SUBMITTED'
            const percentage = isCompleted && q.max_score
              ? Math.round((parseFloat(q.score) / parseFloat(q.max_score)) * 100)
              : null
            return (
              <div key={q.id}
                className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{q.title}</p>
                    {q.subject_name && (
                      <p className="text-xs text-gray-500 mt-0.5">{q.subject_name}</p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>

                {q.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{q.description}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                  {q.time_limit && <span>⏱ {q.time_limit} min</span>}
                  {q.due_date && (
                    <span>
                      📅 {new Date(q.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>

                {isCompleted && percentage !== null ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Score</span>
                      <span className={`font-bold ${percentage >= 80 ? 'text-green-600' : percentage >= 50 ? 'text-blue-600' : 'text-red-600'}`}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 text-right">
                      {parseFloat(q.score).toFixed(1)} / {parseFloat(q.max_score).toFixed(1)} pts
                    </p>
                  </div>
                ) : (
                  <Link
                    href={`/student/quiz/${q.id}`}
                    className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2
                               bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium
                               rounded-lg transition"
                  >
                    {q.attempt_status === 'IN_PROGRESS' ? 'Continuer' : 'Commencer'}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
