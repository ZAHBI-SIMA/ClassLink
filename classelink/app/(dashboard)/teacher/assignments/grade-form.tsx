'use client'

import { useActionState } from 'react'
import { gradeSubmission } from '@/actions/assignments'
import type { ActionResult } from '@/types'

interface Props {
  submissionId: string
  assignmentId: string
  currentScore: number | null
  maxScore: number
}

const initialState: ActionResult | null = null

export function GradeForm({ submissionId, assignmentId, currentScore, maxScore }: Props) {
  const [state, action, pending] = useActionState(gradeSubmission, initialState)

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
          defaultValue={currentScore ?? ''}
          placeholder="Note"
          className="w-20 px-2 py-1.5 rounded-lg border border-gray-300 text-sm text-center
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-xs text-gray-400">/ {maxScore}</span>
      </div>

      <textarea
        name="feedback"
        rows={2}
        placeholder="Appréciation (facultatif)"
        className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />

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
