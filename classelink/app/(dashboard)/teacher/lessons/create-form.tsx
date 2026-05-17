'use client'

import { useActionState } from 'react'
import { createLesson } from '@/actions/assignments'
import type { ActionResult } from '@/types'

interface TscItem {
  tsc_id: string
  class_id: string
  class_name: string
  subject_id: string
  subject_name: string
  subject_code: string
}

interface ScheduleItem {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  class_name: string
  subject_name: string
  subject_id: string
  class_id: string
}

interface Props {
  tscList: TscItem[]
  scheduleList: ScheduleItem[]
}

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

const initialState: ActionResult | null = null

export function CreateLessonForm({ tscList, scheduleList }: Props) {
  const [state, action, pending] = useActionState(createLesson, initialState)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Nouvelle entrée</h2>

      <form action={action} className="space-y-4">
        {/* Créneau horaire (optionnel) */}
        {scheduleList.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Créneau horaire (optionnel)
            </label>
            <select
              name="schedule_id"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Aucun créneau</option>
              {scheduleList.map(sc => (
                <option key={sc.id} value={sc.id}>
                  {DAYS[sc.day_of_week]} {sc.start_time}–{sc.end_time} · {sc.class_name} / {sc.subject_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Matière + Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Matière <span className="text-red-500">*</span>
            </label>
            <select
              name="subject_id"
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner</option>
              {tscList.map(tsc => (
                <option key={tsc.tsc_id} value={tsc.subject_id}>
                  {tsc.class_name} — {tsc.subject_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Date du cours <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              required
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Titre */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Titre du cours <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder="Ex : Introduction aux équations du premier degré"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Contenu traité */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Contenu traité (ce qui a été fait)
          </label>
          <textarea
            name="content"
            rows={3}
            placeholder="Décrivez ce qui a été vu durant ce cours..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Prochain cours */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Prochain cours
          </label>
          <textarea
            name="next_content"
            rows={2}
            placeholder="Ce qui sera vu au prochain cours..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Devoirs oraux */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Devoirs donnés (oral / autre)
          </label>
          <textarea
            name="homework"
            rows={2}
            placeholder="Devoirs oraux, exercices à préparer..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Feedback */}
        {state && !state.success && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
        )}
        {state && state.success && (
          <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            Entree ajoutee au cahier de texte.
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold
                       hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {pending ? 'Enregistrement...' : 'Ajouter l\'entree'}
          </button>
        </div>
      </form>
    </div>
  )
}
