'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createTeacher } from '@/actions/admin'
import type { ActionResult } from '@/types'

export function TeacherCreateForm() {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    createTeacher,
    null
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state])

  const tempPassword = state?.success ? (state.data as any)?.tempPassword : null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Ajouter un enseignant</h3>

      {tempPassword && (
        <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200">
          <p className="text-xs font-semibold text-green-800 mb-1">Enseignant créé avec succès</p>
          <p className="text-xs text-green-700 mb-2">
            Transmettez ce mot de passe temporaire à l&apos;enseignant :
          </p>
          <div className="flex items-center gap-2 bg-white rounded-lg border border-green-300 px-3 py-2">
            <code className="flex-1 text-sm font-mono font-bold text-green-800 tracking-wider">
              {tempPassword}
            </code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(tempPassword)}
              className="text-green-600 hover:text-green-800 transition"
              title="Copier"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-green-600 mt-1.5">
            Ce mot de passe ne sera plus affiché. Notez-le.
          </p>
        </div>
      )}

      {state && !state.success && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <form ref={formRef} action={action} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Prénom</label>
            <input
              name="firstName"
              required
              placeholder="Jean"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
            <input
              name="lastName"
              required
              placeholder="Kouassi"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            placeholder="jean.kouassi@ecole.ci"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
          <input
            name="phone"
            type="tel"
            placeholder="+225 07 00 00 00 00"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Spécialité</label>
          <input
            name="specialty"
            placeholder="Mathématiques"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">N° matricule</label>
          <input
            name="employeeId"
            placeholder="EMP-001"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm
                     font-medium rounded-lg transition disabled:opacity-50"
        >
          {isPending ? 'Création...' : 'Ajouter l\'enseignant'}
        </button>
      </form>
    </div>
  )
}
