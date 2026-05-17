'use client'

import { useActionState } from 'react'
import { createAssignment } from '@/actions/assignments'
import type { ActionResult } from '@/types'

interface TscItem {
  tsc_id: string
  class_id: string
  class_name: string
  subject_id: string
  subject_name: string
  subject_code: string
}

interface Props {
  tscList: TscItem[]
}

const initialState: ActionResult | null = null

export function CreateAssignmentForm({ tscList }: Props) {
  const [state, action, pending] = useActionState(createAssignment, initialState)

  // Group by class for a cleaner UX
  const classMap = new Map<string, { class_name: string; subjects: TscItem[] }>()
  for (const tsc of tscList) {
    if (!classMap.has(tsc.class_id)) {
      classMap.set(tsc.class_id, { class_name: tsc.class_name, subjects: [] })
    }
    classMap.get(tsc.class_id)!.subjects.push(tsc)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Nouveau devoir</h2>

      <form action={action} className="space-y-4">
        {/* Classe */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Classe <span className="text-red-500">*</span>
            </label>
            <select
              name="class_id"
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner une classe</option>
              {Array.from(classMap.entries()).map(([classId, { class_name }]) => (
                <option key={classId} value={classId}>{class_name}</option>
              ))}
            </select>
          </div>

          {/* Matière */}
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
              <option value="">Sélectionner une matière</option>
              {tscList.map(tsc => (
                <option key={tsc.tsc_id} value={tsc.subject_id}>
                  {tsc.class_name} — {tsc.subject_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Titre */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Titre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder="Ex : Exercices sur les fractions"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Description / Consignes
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="Décrivez le devoir, les consignes, les ressources nécessaires..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Date limite + Note max */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Date limite <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="due_date"
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Note maximale
            </label>
            <input
              type="number"
              name="max_score"
              min="1"
              max="100"
              step="0.5"
              defaultValue="20"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Feedback */}
        {state && !state.success && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {state.error}
          </p>
        )}
        {state && state.success && (
          <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            Devoir créé avec succès.
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold
                       hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {pending ? 'Création...' : 'Créer le devoir'}
          </button>
        </div>
      </form>
    </div>
  )
}
