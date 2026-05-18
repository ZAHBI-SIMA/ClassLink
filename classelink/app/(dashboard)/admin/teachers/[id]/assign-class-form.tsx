'use client'

import { useActionState, useTransition } from 'react'
import { assignTeacherToClass, removeTeacherAssignment } from '@/actions/admin'
import type { ActionResult } from '@/types'

interface Assignment {
  tsc_id: string
  class_name: string
  subject_name: string
  subject_code: string
}

interface Subject { id: string; name: string; code: string }
interface Class   { id: string; name: string }

interface Props {
  teacherId: string
  assignments: Assignment[]
  subjects: Subject[]
  classes: Class[]
}

function RemoveButton({ tscId, teacherId }: { tscId: string; teacherId: string }) {
  const [, startTransition] = useTransition()
  return (
    <button
      type="button"
      onClick={() => startTransition(async () => {
        await removeTeacherAssignment(tscId, teacherId)
      })}
      className="text-xs text-red-500 hover:text-red-700 font-medium transition"
      title="Retirer cette attribution"
    >
      Retirer
    </button>
  )
}

export function AssignClassForm({ teacherId, assignments, subjects, classes }: Props) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    assignTeacherToClass,
    null
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Attributions classes / matières</h2>
      </div>

      {/* Liste des attributions actuelles */}
      {assignments.length > 0 ? (
        <div className="divide-y divide-gray-50">
          {assignments.map((a) => (
            <div key={a.tsc_id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                                 font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  {a.subject_code}
                </span>
                <span className="text-sm text-gray-700">{a.subject_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  {a.class_name}
                </span>
                <RemoveButton tscId={a.tsc_id} teacherId={teacherId} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 py-4 text-sm text-gray-400">
          Aucune attribution pour l&apos;instant.
        </p>
      )}

      {/* Formulaire d'ajout */}
      {subjects.length > 0 && classes.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Nouvelle attribution
          </p>
          {state && !state.success && (
            <p className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}
          {state?.success && (
            <p className="mb-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              Attribution ajoutée.
            </p>
          )}
          <form action={action} className="flex flex-wrap gap-2 items-end">
            <input type="hidden" name="teacher_id" value={teacherId} />
            <div className="flex-1 min-w-36">
              <label className="block text-xs font-medium text-gray-600 mb-1">Matière</label>
              <select
                name="subject_id"
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">— Matière —</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-36">
              <label className="block text-xs font-medium text-gray-600 mb-1">Classe</label>
              <select
                name="class_id"
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">— Classe —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm
                         font-medium rounded-lg transition disabled:opacity-50"
            >
              {isPending ? '...' : 'Affecter'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
