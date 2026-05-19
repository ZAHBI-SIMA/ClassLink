'use client'

import { useState, useTransition } from 'react'
import { authorizeTrip } from '@/actions/trips'

interface Props {
  tripId: string
  studentId: string
  studentName: string
  tripTitle: string
  onClose: () => void
}

export function AuthorizeModal({ tripId, studentId, studentName, tripTitle, onClose }: Props) {
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleAction(authorized: boolean) {
    setError(null)
    startTransition(async () => {
      const result = await authorizeTrip(tripId, studentId, authorized, notes || undefined)
      if (!result.success) {
        setError(result.error ?? 'Une erreur est survenue.')
      } else {
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Autorisation de sortie</h2>
            <p className="text-sm text-gray-500 mt-0.5">{tripTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-700">
          <span className="font-medium">Élève :</span> {studentName}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes / commentaires <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Ajouter un commentaire..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => handleAction(false)}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 text-sm font-medium rounded-lg transition disabled:opacity-50"
          >
            Refuser
          </button>
          <button
            onClick={() => handleAction(true)}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
          >
            {isPending ? 'En cours...' : 'Autoriser'}
          </button>
        </div>
      </div>
    </div>
  )
}
