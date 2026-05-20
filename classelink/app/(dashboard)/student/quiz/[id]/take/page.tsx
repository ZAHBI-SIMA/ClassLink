import { getQuizWithQuestions, startQuizAttempt } from '@/actions/student-quiz'
import { notFound } from 'next/navigation'
import { QuizPlayer } from './quiz-player'

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: 'Passer le quiz' }

export default async function TakeQuizPage({ params }: Props) {
  const { id } = await params

  const quizResult = await getQuizWithQuestions(id)
  if (!quizResult.success || !quizResult.data) notFound()

  const { quiz, questions } = quizResult.data

  // Start or resume attempt
  const attemptResult = await startQuizAttempt(id)
  if (!attemptResult.success) {
    return (
      <div className="max-w-lg mx-auto mt-12 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-medium">{attemptResult.error}</p>
        <a href="/student/quiz"
          className="mt-4 inline-block text-sm text-red-600 underline">
          Retour aux quiz
        </a>
      </div>
    )
  }

  return (
    <QuizPlayer
      quizId={id}
      quiz={quiz}
      questions={questions}
      attemptId={attemptResult.data!.attemptId}
    />
  )
}
