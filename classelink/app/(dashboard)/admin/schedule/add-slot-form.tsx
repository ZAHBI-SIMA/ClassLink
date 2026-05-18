'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createScheduleSlot } from '@/actions/admin'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const TIME_PRESETS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00',
]

interface Teacher { id: string; first_name: string; last_name: string }
interface Subject { id: string; name: string; code: string }

interface Props {
  classId: string
  teachers: Teacher[]
  subjects: Subject[]
}

export function AddSlotForm({ classId, teachers, subjects }: Props) {
  const [state, action, isPending] = useActionState(createScheduleSlot, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state])

  if (teachers.length === 0) {
    return (
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-3">
        Aucun enseignant actif. Créez d&apos;abord un enseignant dans la section{' '}
        <a href="/admin/teachers" className="underline font-medium">Enseignants</a>.
      </p>
    )
  }
  if (subjects.length === 0) {
    return (
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-3">
        Aucune matière créée. Allez dans{' '}
        <a href="/admin/subjects" className="underline font-medium">Matières</a> d&apos;abord.
      </p>
    )
  }

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="class_id" value={classId} />

      {state && !state.success && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="p-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs">
          Créneau ajouté ✓
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Enseignant *</label>
        <select name="teacher_id" required
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                     focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">— Sélectionner —</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>
              {t.last_name} {t.first_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Matière *</label>
        <select name="subject_id" required
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                     focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">— Sélectionner —</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Jour *</label>
        <select name="day_of_week" required
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                     focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">— Sélectionner —</option>
          {DAYS.map((d, i) => (
            <option key={i + 1} value={i + 1}>{d}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Début *</label>
          <select name="start_time" required
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">—</option>
            {TIME_PRESETS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Fin *</label>
          <select name="end_time" required
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">—</option>
            {TIME_PRESETS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Salle (optionnel)</label>
        <input type="text" name="room" placeholder="ex : A12, Labo Info"
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                     focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <button type="submit" disabled={isPending}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                   text-white text-sm font-medium rounded-lg transition">
        {isPending ? 'Ajout…' : '+ Ajouter le créneau'}
      </button>
    </form>
  )
}
