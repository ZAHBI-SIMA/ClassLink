'use client'

import { useActionState } from 'react'
import { createParent } from '@/actions/admin'
import { useEffect, useRef } from 'react'

export function ParentCreateForm() {
  const [state, action, isPending] = useActionState(createParent, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Ajouter un parent</h3>

      {state?.success && (state as any).data?.tempPassword && (
        <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200">
          <p className="text-sm font-semibold text-green-800">✅ Parent ajouté avec succès</p>
          <p className="text-xs text-green-700 mt-1">Mot de passe temporaire :</p>
          <p className="font-mono font-bold text-green-900 text-sm mt-0.5">{(state as any).data.tempPassword}</p>
          <p className="text-xs text-green-600 mt-1">Notez ce mot de passe, il ne sera plus affiché.</p>
        </div>
      )}

      {state && !state.success && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <form ref={formRef} action={action} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Prénom</label>
            <input name="firstName" required placeholder="Marie"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
            <input name="lastName" required placeholder="Ouattara"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
          <input name="email" type="email" required placeholder="marie.ouattara@gmail.com"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
          <input name="phone" type="tel" placeholder="+225 07 00 00 00 00"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <p className="text-xs text-gray-400">Un mot de passe temporaire sera généré automatiquement.</p>
        <button type="submit" disabled={isPending}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm
                     font-medium rounded-lg transition">
          {isPending ? 'Ajout...' : 'Ajouter le parent'}
        </button>
      </form>
    </div>
  )
}
