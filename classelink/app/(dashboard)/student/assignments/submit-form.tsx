'use client'

import { useActionState, useState } from 'react'
import { submitAssignment } from '@/actions/assignments'
import type { ActionResult } from '@/types'

interface Props {
  assignmentId: string
  title: string
  maxScore: number
}

const initialState: ActionResult | null = null

export function SubmitAssignmentForm({ assignmentId, title, maxScore }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(submitAssignment, initialState)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white
                   hover:bg-blue-700 transition"
      >
        Rendre le devoir
      </button>
    )
  }

  return (
    <div className="mt-3 border border-blue-200 rounded-xl bg-blue-50 p-4 space-y-3">
      <p className="text-sm font-medium text-blue-900">{title} — note max : {maxScore}</p>

      <form action={action} className="space-y-3">
        <input type="hidden" name="assignment_id" value={assignmentId} />

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Votre réponse / travail <span className="text-red-500">*</span>
          </label>
          <textarea
            name="content"
            rows={6}
            required
            placeholder="Rédigez ou collez votre travail ici..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>

        {state && !state.success && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
        )}
        {state && state.success && (
          <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            Devoir rendu avec succès.
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold
                       hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {pending ? 'Envoi...' : 'Envoyer le devoir'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600
                       hover:bg-gray-50 transition"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
