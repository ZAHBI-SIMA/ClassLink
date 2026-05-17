'use client'

import { useActionState } from 'react'
import { forgotPasswordAction } from '@/actions/auth'
import type { ActionResult } from '@/types'
import Link from 'next/link'

export function ForgotPasswordForm() {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    forgotPasswordAction,
    null
  )

  if (state?.success) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Email envoyé</h2>
        <p className="text-sm text-gray-500 mb-6">
          Si un compte existe avec cet email, vous recevrez un lien de réinitialisation valable{' '}
          <strong>15 minutes</strong>.
        </p>
        <Link
          href="/login"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Mot de passe oublié</h2>
        <p className="text-sm text-gray-500">
          Saisissez votre email pour recevoir un lien de réinitialisation.
        </p>
      </div>

      {state && !state.success && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Adresse email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="votre@email.ci"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder-gray-400 transition"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-medium text-sm
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Envoi en cours...
            </span>
          ) : (
            'Envoyer le lien'
          )}
        </button>
      </form>

      <div className="mt-5 text-center">
        <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
          ← Retour à la connexion
        </Link>
      </div>
    </>
  )
}
