'use client'

import { useActionState } from 'react'
import { submitJustification } from '@/actions/parent'
import type { ActionResult } from '@/types'

interface Props {
  attendanceId: string
  date: string
}

export function JustifyForm({ attendanceId, date }: Props) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    submitJustification,
    null
  )

  if (state?.success) {
    return (
      <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        Justification soumise avec succès.
      </p>
    )
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="attendance_id" value={attendanceId} />

      {state && !state.success && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          {state.error}
        </p>
      )}

      <textarea
        name="justification"
        rows={2}
        required
        placeholder={`Motif d'absence du ${date}…`}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />

      <button
        type="submit"
        disabled={pending}
        className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition"
      >
        {pending ? 'Envoi…' : 'Justifier cette absence'}
      </button>
    </form>
  )
}
