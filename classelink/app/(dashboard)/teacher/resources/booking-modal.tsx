'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createBooking } from '@/actions/resources'
import type { ActionResult } from '@/types'

interface Props {
  resource: { id: string; name: string; type: string; location?: string | null }
  onClose: () => void
}

const today = new Date().toISOString().split('T')[0]

export function BookingModal({ resource, onClose }: Props) {
  const [state, action, pending] = useActionState<ActionResult<{ id: string }> | null, FormData>(
    createBooking,
    null
  )
  const dialogRef = useRef<HTMLDivElement>(null)

  // Fermer après succès
  useEffect(() => {
    if (state?.success) {
      const t = setTimeout(onClose, 800)
      return () => clearTimeout(t)
    }
  }, [state, onClose])

  // Fermer au clic extérieur
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  const typeLabel: Record<string, string> = {
    ROOM:      'Salle',
    EQUIPMENT: 'Équipement',
    VEHICLE:   'Véhicule',
    OTHER:     'Autre',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={`Réserver — ${resource.name}`}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              {typeLabel[resource.type] ?? resource.type}
            </p>
            <h2 className="text-base font-semibold text-gray-900">{resource.name}</h2>
            {resource.location && (
              <p className="text-xs text-gray-400">{resource.location}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Feedback */}
        {state && !state.success && (
          <div className="mx-6 mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="mx-6 mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
            Réservation confirmée !
          </div>
        )}

        {/* Formulaire */}
        <form action={action} className="px-6 py-5 space-y-4">
          <input type="hidden" name="resourceId" value={resource.id} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              required
              placeholder="Ex : Cours de physique — 3ème A"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              name="bookingDate"
              type="date"
              required
              defaultValue={today}
              min={today}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Début <span className="text-red-500">*</span>
              </label>
              <input
                name="startTime"
                type="time"
                required
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fin <span className="text-red-500">*</span>
              </label>
              <input
                name="endTime"
                type="time"
                required
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motif / Objet
            </label>
            <textarea
              name="purpose"
              rows={2}
              placeholder="Précisez l'usage prévu (facultatif)"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700
                         border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 py-2.5 px-4 text-sm font-semibold text-white
                         bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition"
            >
              {pending ? 'Envoi…' : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
