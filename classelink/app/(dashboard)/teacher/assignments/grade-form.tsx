'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { gradeSubmission } from '@/actions/assignments'
import { suggestSubmissionGrade } from '@/actions/ai'
import type { ActionResult } from '@/types'

interface Props {
  submissionId: string
  assignmentId: string
  currentScore: number | null
  maxScore: number
  assignmentTitle?: string
  assignmentDescription?: string | null
  submissionText?: string | null
}

const initialState: ActionResult | null = null

export function GradeForm({
  submissionId, assignmentId, currentScore, maxScore,
  assignmentTitle, assignmentDescription, submissionText,
}: Props) {
  const [state, action, pending] = useActionState(gradeSubmission, initialState)
  const [score, setScore] = useState(currentScore?.toString() ?? '')
  const [feedback, setFeedback] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  async function handleSuggest() {
    if (!submissionText?.trim()) return
    setAiError(null)
    setAiLoading(true)
    const result = await suggestSubmissionGrade({
      assignmentTitle: assignmentTitle ?? 'Devoir',
      assignmentDescription: assignmentDescription ?? null,
      studentText: submissionText,
      maxScore,
    })
    setAiLoading(false)
    if (result.success && result.data) {
      if (result.data.score !== null) setScore(String(result.data.score))
      setFeedback(result.data.feedback)
    } else if (!result.success) {
      setAiError(result.error ?? 'Erreur IA.')
    }
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="submission_id" value={submissionId} />
      <input type="hidden" name="assignment_id" value={assignmentId} />

      <div className="flex items-center gap-2">
        <input
          type="number"
          name="score"
          min="0"
          max={maxScore}
          step="0.25"
          value={score}
          onChange={e => setScore(e.target.value)}
          placeholder="Note"
          className="w-20 px-2 py-1.5 rounded-lg border border-gray-300 text-sm text-center
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-xs text-gray-400">/ {maxScore}</span>
        {submissionText?.trim() && (
          <button
            type="button"
            title="Suggérer une note avec l'IA"
            onClick={handleSuggest}
            disabled={aiLoading}
            className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-lg
                       bg-violet-50 text-violet-600 hover:bg-violet-100 transition disabled:opacity-40"
          >
            {aiLoading ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            )}
          </button>
        )}
      </div>

      <textarea
        name="feedback"
        rows={2}
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        placeholder="Appréciation (facultatif)"
        className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />

      {aiError && <p className="text-xs text-orange-600">{aiError}</p>}
      {state && !state.success && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      {state && state.success && (
        <p className="text-xs text-green-600">Noté.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold
                   hover:bg-blue-700 disabled:opacity-50 transition self-start"
      >
        {pending ? '...' : 'Enregistrer'}
      </button>
    </form>
  )
}
