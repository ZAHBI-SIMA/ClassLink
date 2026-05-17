'use client'

import { useActionState, useState } from 'react'
import { resetTeacherPassword } from '@/actions/admin'
import type { ActionResult } from '@/types'

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    resetTeacherPassword,
    null
  )
  const [visible, setVisible] = useState(false)

  const tempPassword = state?.success ? (state.data as any)?.tempPassword : null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-1">Mot de passe</h3>
      <p className="text-xs text-gray-400 mb-4">
        Les mots de passe sont chiffrés et ne peuvent pas être récupérés.<br />
        Vous pouvez générer un nouveau mot de passe temporaire.
      </p>

      {tempPassword ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-xs font-semibold text-amber-800 mb-2">
            Nouveau mot de passe temporaire généré
          </p>
          <div className="flex items-center gap-2 bg-white rounded-lg border border-amber-300 px-3 py-2.5 mb-2">
            <code className="flex-1 text-base font-mono font-bold text-amber-900 tracking-widest">
              {visible ? tempPassword : '•'.repeat(tempPassword.length)}
            </code>
            <button
              type="button"
              onClick={() => setVisible(v => !v)}
              className="text-amber-500 hover:text-amber-700 transition"
              title={visible ? 'Masquer' : 'Afficher'}
            >
              {visible ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(tempPassword)}
              className="text-amber-500 hover:text-amber-700 transition"
              title="Copier"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-amber-600">
            Transmettez ce mot de passe à l&apos;enseignant. Il ne sera plus affiché.
          </p>
        </div>
      ) : (
        <>
          {state && !state.success && (
            <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {state.error}
            </div>
          )}
          <form action={action}>
            <input type="hidden" name="userId" value={userId} />
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 px-4 rounded-lg border border-gray-300 bg-white text-gray-700
                         text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50 flex
                         items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              {isPending ? 'Génération...' : 'Générer un nouveau mot de passe'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
