'use client'

import { useActionState } from 'react'
import { createAnnouncement } from '@/actions/announcements'
import type { ActionResult } from '@/types'

interface CreateAnnouncementFormProps {
  classes: { id: string; name: string }[]
}

export function CreateAnnouncementForm({ classes }: CreateAnnouncementFormProps) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    createAnnouncement,
    null
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Nouvelle annonce</h2>

      {state && !state.success && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          Annonce créée avec succès.
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
          <input
            type="text"
            name="title"
            required
            placeholder="Titre de l'annonce"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
          <textarea
            name="content"
            required
            rows={5}
            placeholder="Rédigez votre annonce…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">Rôles ciblés</p>
          <div className="space-y-2">
            {[
              { value: 'TEACHER', label: 'Enseignants' },
              { value: 'PARENT', label: 'Parents' },
              { value: 'STUDENT', label: 'Élèves' },
            ].map(r => (
              <label key={r.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="target_roles"
                  value={r.value}
                  defaultChecked
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {r.label}
              </label>
            ))}
          </div>
        </div>

        {classes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Classe (optionnel)
            </label>
            <select
              name="class_id"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            name="is_pinned"
            value="on"
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Épingler cette annonce
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date d&apos;expiration (optionnel)
          </label>
          <input
            type="date"
            name="expires_at"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition"
        >
          {isPending ? 'Publication…' : 'Publier l\'annonce'}
        </button>
      </form>
    </div>
  )
}
