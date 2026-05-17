'use client'

import { useActionState, useState } from 'react'
import { loginAction } from '@/actions/auth'
import type { ActionResult } from '@/types'
import Link from 'next/link'

interface Props {
  error?: string
  callbackUrl?: string
}

const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: 'Ce compte Google est déjà lié à un autre utilisateur.',
  SessionRequired: 'Vous devez être connecté pour accéder à cette page.',
}

export function LoginForm({ error, callbackUrl }: Props) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    loginAction,
    null
  )
  const [showPassword, setShowPassword] = useState(false)

  const errorMessage =
    (error && ERROR_MESSAGES[error]) ??
    (state && !state.success ? state.error : null)

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Connexion</h2>
        <p className="text-sm text-gray-500 mt-1">Entrez vos identifiants pour accéder à votre espace</p>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd" />
          </svg>
          {errorMessage}
        </div>
      )}

      <form action={action} className="space-y-4">
        {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Adresse email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="votre@email.ci"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder-gray-400 transition"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-400 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white
                     font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                     focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Connexion en cours...
            </span>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-6">
        Problème de connexion ?{' '}
        <a href="mailto:support@classelink.ci" className="text-blue-600 hover:underline">
          Contacter le support
        </a>
      </p>
    </>
  )
}
