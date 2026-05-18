'use client'

import { useActionState, useTransition } from 'react'
import { linkStudentToParent, unlinkStudentFromParent } from '@/actions/admin'
import type { ActionResult } from '@/types'

interface Student {
  id: string
  first_name: string
  last_name: string
  student_number: string
  class_name: string | null
}

interface LinkedStudent {
  id: string
  first_name: string
  last_name: string
  class_name: string | null
  relation: string | null
}

interface Props {
  parentId: string
  available: Student[]
  linked: LinkedStudent[]
}

const RELATIONS = ['Père', 'Mère', 'Tuteur', 'Tutrice', 'Grand-père', 'Grand-mère', 'Oncle', 'Tante', 'Autre']

function UnlinkButton({ parentId, studentId }: { parentId: string; studentId: string }) {
  const [, startTransition] = useTransition()
  return (
    <button
      type="button"
      onClick={() => startTransition(async () => {
        await unlinkStudentFromParent(parentId, studentId)
      })}
      className="text-xs text-red-500 hover:text-red-700 font-medium transition"
      title="Retirer ce lien"
    >
      Retirer
    </button>
  )
}

export function LinkStudentForm({ parentId, available, linked }: Props) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    linkStudentToParent,
    null
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Enfants associés</h2>
      </div>

      {/* Liste des élèves déjà liés */}
      {linked.length > 0 ? (
        <div className="divide-y divide-gray-50">
          {linked.map((child) => (
            <div key={child.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center
                                text-green-700 text-xs font-semibold flex-shrink-0">
                  {child.first_name[0]}{child.last_name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {child.first_name} {child.last_name}
                  </p>
                  {child.class_name && (
                    <p className="text-xs text-gray-400">{child.class_name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {child.relation && (
                  <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium border border-purple-100">
                    {child.relation}
                  </span>
                )}
                <UnlinkButton parentId={parentId} studentId={child.id} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 py-4 text-sm text-gray-400">Aucun enfant associé pour l&apos;instant.</p>
      )}

      {/* Formulaire d'ajout */}
      {available.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Associer un élève
          </p>
          {state && !state.success && (
            <p className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}
          <form action={action} className="flex flex-wrap gap-2 items-end">
            <input type="hidden" name="parent_id" value={parentId} />
            <div className="flex-1 min-w-40">
              <label className="block text-xs font-medium text-gray-600 mb-1">Élève</label>
              <select
                name="student_id"
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">— Sélectionner —</option>
                {available.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.last_name} {s.first_name}
                    {s.class_name ? ` (${s.class_name})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-gray-600 mb-1">Lien de parenté</label>
              <select
                name="relation"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">— Optionnel —</option>
                {RELATIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm
                         font-medium rounded-lg transition disabled:opacity-50"
            >
              {isPending ? '...' : 'Associer'}
            </button>
          </form>
        </div>
      )}

      {available.length === 0 && linked.length === 0 && (
        <p className="px-5 py-4 text-sm text-gray-400 border-t border-gray-100">
          Aucun élève disponible à associer.
        </p>
      )}
    </div>
  )
}
