'use client'

import { useActionState, useEffect, useState } from 'react'
import { createBooking } from '@/actions/resources'
import type { ActionResult } from '@/types'

interface Resource {
  id: string
  name: string
  type: string
}

interface Props {
  resources: Resource[]
  preselectedId?: string
  label?: string
}

export function BookingModal({ resources, preselectedId, label }: Props) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(createBooking, null)

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
    }
  }, [state])

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition"
      >
        {label ?? 'Réserver'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Nouvelle réservation</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form action={formAction} className="space-y-4">
              {state && !state.success && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {state.error}
                </div>
              )}

              {preselectedId ? (
                <input type="hidden" name="resourceId" value={preselectedId} />
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ressource *</label>
                  <select
                    name="resourceId"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choisir une ressource…</option>
                    {resources.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="ex: Cours de physique"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                <input
                  name="bookingDate"
                  type="date"
                  required
                  min={today}
                  defaultValue={today}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Heure début *</label>
                  <input
                    name="startTime"
                    type="time"
                    required
                    defaultValue="08:00"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Heure fin *</label>
                  <input
                    name="endTime"
                    type="time"
                    required
                    defaultValue="10:00"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Objet / Motif</label>
                <textarea
                  name="purpose"
                  rows={2}
                  placeholder="Motif de la réservation…"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition"
                >
                  {pending ? 'Réservation…' : 'Réserver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
