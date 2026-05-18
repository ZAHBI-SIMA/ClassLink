'use client'

import { useActionState, useEffect } from 'react'
import { createCouncil } from '@/actions/council'
import { useRouter } from 'next/navigation'
import type { ActionResult } from '@/types'

interface Props {
  classes: { id: string; name: string; academic_year_name: string; academic_year_id: string }[]
  terms:   { id: string; name: string; term_order: number; academic_year_id: string }[]
}

export function CreateCouncilForm({ classes, terms }: Props) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(createCouncil, null)

  useEffect(() => {
    if (state?.success && state.data?.id) {
      router.push(`/admin/councils/${state.data.id}`)
    }
  }, [state, router])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <form action={formAction} className="space-y-5">
        {state && !state.success && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Classe *</label>
            <select name="classId" required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sélectionner une classe…</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Trimestre *</label>
            <select name="termId" required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sélectionner un trimestre…</option>
              {terms.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Hidden academic year (pris du premier terme sélectionné) */}
          <input type="hidden" name="academicYearId" value={terms[0]?.academic_year_id ?? ''} />

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date et heure prévues</label>
            <input name="scheduledAt" type="datetime-local"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Président(e) du conseil</label>
            <input name="president" type="text"
              placeholder="ex: M. Konan, Direction"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => history.back()}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
            Annuler
          </button>
          <button type="submit" disabled={pending}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
            {pending ? 'Création…' : 'Créer le conseil'}
          </button>
        </div>
      </form>
    </div>
  )
}
