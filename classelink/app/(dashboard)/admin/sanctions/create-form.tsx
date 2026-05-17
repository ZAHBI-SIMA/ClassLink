'use client'

import { useActionState } from 'react'
import { createSanction } from '@/actions/admin'
import type { ActionResult } from '@/types'

const SANCTION_TYPES = [
  { value: 'AVERTISSEMENT',  label: 'Avertissement' },
  { value: 'BLAME',          label: 'Blâme' },
  { value: 'EXCLUSION_TEMP', label: 'Exclusion temporaire' },
  { value: 'RENVOI',         label: 'Renvoi' },
  { value: 'AUTRE',          label: 'Autre' },
]

interface Student {
  id: string
  first_name: string
  last_name: string
  class_name: string | null
}

interface Props {
  students: Student[]
}

export function CreateSanctionForm({ students }: Props) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(createSanction, null)

  return (
    <form action={action} className="space-y-4">
      {state && !state.success && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Sanction enregistrée.
        </p>
      )}

      {/* Élève — datalist */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Élève *</label>
        <input
          list="students-list"
          name="student_id"
          placeholder="Rechercher un élève…"
          required
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <datalist id="students-list">
          {students.map(s => (
            <option key={s.id} value={s.id}>
              {s.last_name} {s.first_name}{s.class_name ? ` — ${s.class_name}` : ''}
            </option>
          ))}
        </datalist>
        <p className="text-xs text-gray-400 mt-1">
          Saisir le nom ou l&apos;ID de l&apos;élève et sélectionner dans la liste.
        </p>
      </div>

      {/* Type de sanction */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Type de sanction *</label>
        <select
          name="type"
          required
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choisir…</option>
          {SANCTION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Raison */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Raison *</label>
        <input
          name="reason"
          type="text"
          required
          placeholder="Motif de la sanction"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Description (optionnel)</label>
        <textarea
          name="description"
          rows={3}
          placeholder="Détails supplémentaires…"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
        <input
          name="date"
          type="date"
          required
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Durée */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Durée en jours (optionnel)</label>
        <input
          name="duration"
          type="number"
          min={1}
          placeholder="Ex : 3"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
      >
        {pending ? 'Enregistrement…' : 'Enregistrer la sanction'}
      </button>
    </form>
  )
}
