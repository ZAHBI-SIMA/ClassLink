'use client'

import { useState } from 'react'
import { submitQuizAttempt } from '@/actions/student-quiz'
import { useRouter } from 'next/navigation'

interface Question {
  id: string
  question: string
  type: 'MCQ' | 'TRUE_FALSE' | 'SHORT'
  options: string[] | null
  points: number
}

interface Props {
  quizId: string
  quiz: { title: string; time_limit?: number }
  questions: Question[]
  attemptId: string
}

export function QuizPlayer({ quizId, quiz, questions, attemptId }: Props) {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const q = questions[current]
  const total = questions.length
  const progress = ((current + 1) / total) * 100
  const isLast = current === total - 1
  const allAnswered = questions.every(q => answers[q.id] !== undefined)

  const setAnswer = (qId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [qId]: val }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await submitQuizAttempt(attemptId, answers)
      if (!res.success) {
        setError(res.error ?? 'Erreur lors de la soumission.')
        return
      }
      setResult(res.data ?? null)
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    const pct = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0
    return (
      <div className="max-w-lg mx-auto text-center space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="text-6xl mb-4">
            {pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '📚'}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {pct >= 80 ? 'Excellent !' : pct >= 50 ? 'Bien joué !' : 'Continuez vos efforts !'}
          </h2>
          <p className="text-gray-500 text-sm mb-4">Quiz terminé</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-4xl font-bold text-gray-900">{pct}%</p>
            <p className="text-sm text-gray-500 mt-1">
              {result.score.toFixed(1)} / {result.maxScore.toFixed(1)} points
            </p>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <div
              className={`h-3 rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <button
            onClick={() => router.push('/student/quiz')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition text-sm"
          >
            Retour aux quiz
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 truncate">{quiz.title}</h1>
        <span className="text-sm text-gray-500">{current + 1} / {total}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-purple-600 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
            Question {current + 1}
          </span>
          <p className="text-base font-medium text-gray-900 mt-2">{q.question}</p>
          <p className="text-xs text-gray-400 mt-1">{q.points} point{q.points !== 1 ? 's' : ''}</p>
        </div>

        {/* MCQ */}
        {q.type === 'MCQ' && q.options && (
          <div className="space-y-2">
            {(typeof q.options === 'string' ? JSON.parse(q.options) : q.options).map((opt: string, i: number) => (
              <label key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition
                  ${answers[q.id] === opt
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-gray-200 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name={`q_${q.id}`}
                  value={opt}
                  checked={answers[q.id] === opt}
                  onChange={() => setAnswer(q.id, opt)}
                  className="text-purple-600"
                />
                <span className="text-sm text-gray-800">{opt}</span>
              </label>
            ))}
          </div>
        )}

        {/* TRUE_FALSE */}
        {q.type === 'TRUE_FALSE' && (
          <div className="flex gap-3">
            {['Vrai', 'Faux'].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setAnswer(q.id, val)}
                className={`flex-1 py-3 rounded-xl border font-medium text-sm transition
                  ${answers[q.id] === val
                    ? 'border-purple-400 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                {val}
              </button>
            ))}
          </div>
        )}

        {/* SHORT answer */}
        {q.type === 'SHORT' && (
          <input
            type="text"
            value={answers[q.id] ?? ''}
            onChange={e => setAnswer(q.id, e.target.value)}
            placeholder="Votre réponse..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg
                     hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          ← Précédent
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !allAnswered}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold
                       rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? 'Soumission...' : 'Soumettre le quiz'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrent(c => Math.min(total - 1, c + 1))}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium
                       rounded-lg transition"
          >
            Suivant →
          </button>
        )}
      </div>

      {/* Quick navigation dots */}
      <div className="flex justify-center gap-1.5 flex-wrap">
        {questions.map((qn, i) => (
          <button
            key={qn.id}
            type="button"
            onClick={() => setCurrent(i)}
            className={`w-7 h-7 rounded-full text-xs font-bold transition
              ${i === current ? 'bg-purple-600 text-white' :
                answers[qn.id] ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}
