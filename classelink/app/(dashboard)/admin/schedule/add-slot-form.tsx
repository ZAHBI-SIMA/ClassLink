'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createScheduleSlot } from '@/actions/admin'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

interface Tsc {
  id: string
  subject_name: string
  teacher_first: string
  teacher_last: string
}

export function AddSlotForm({ classId, tscList }: { classId: string; tscList: Tsc[] }) {
  const [state, action, isPending] = useActionState(createScheduleSlot, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="class_id" value={classId} />

      {state && !state.success && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs">
          Créneau ajouté.
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Matière / Enseignant *</label>
        <select name="tsc_id" required
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                     focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">— Sélectionner —</option>
          {tscList.map(t => (
            <option key={t.id} value={t.id}>
              {t.subject_name} — {t.teacher_first} {t.teacher_last}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Jour *</label>
        <select name="day_of_week" required
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                     focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">— Sélectionner —</option>
          {DAYS.map((d, i) => (
            <option key={i + 1} value={i + 1}>{d}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Heure début *</label>
          <input type="time" name="start_time" required
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Heure fin *</label>
          <input type="time" name="end_time" required
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Salle (optionnel)</label>
        <input type="text" name="room" placeholder="ex : A12"
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                     focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <button type="submit" disabled={isPending}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                   text-white text-sm font-medium rounded-lg transition">
        {isPending ? 'Ajout...' : 'Ajouter le créneau'}
      </button>
    </form>
  )
}
