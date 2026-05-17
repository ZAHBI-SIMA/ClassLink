'use client'

import { useActionState } from 'react'
import { resetStudentPassword } from '@/actions/admin'
import { useState } from 'react'

export function ResetStudentPasswordForm({ userId }: { userId: string }) {
  const [state, action, isPending] = useActionState(resetStudentPassword, null)
  const [show, setShow] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Mot de passe</h2>

      {state?.success && (state as any).data?.tempPassword && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
          <p className="text-xs text-green-700 font-medium mb-1">Nouveau mot de passe temporaire :</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono font-bold text-green-800 bg-white rounded px-2 py-1 border border-green-200">
              {show ? (state as any).data.tempPassword : '••••••••••••'}
            </code>
            <button type="button" onClick={() => setShow(v => !v)}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
              {show
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              }
            </button>
            <button type="button"
              onClick={() => navigator.clipboard.writeText((state as any).data.tempPassword)}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            </button>
          </div>
          <p className="text-xs text-green-600 mt-1.5">Communiquez ce mot de passe à l&apos;élève, il ne sera plus affiché.</p>
        </div>
      )}

      {state && !state.success && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-3">
        <input type="hidden" name="userId" value={userId} />
        <p className="text-xs text-gray-500">
          Génère un nouveau mot de passe aléatoire et invalide l&apos;ancien.
        </p>
        <button type="submit" disabled={isPending}
          className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50
                     text-white text-sm font-medium rounded-lg transition">
          {isPending ? 'Génération...' : 'Réinitialiser le mot de passe'}
        </button>
      </form>
    </div>
  )
}
