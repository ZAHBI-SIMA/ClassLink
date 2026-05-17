'use client'

import { useRef } from 'react'
import Link from 'next/link'

export function TwoFactorForm() {
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  // Navigation automatique entre les cases
  function handleInput(index: number, value: string) {
    if (value.length === 1 && index < 5) {
      inputs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    pasted.split('').forEach((char, i) => {
      if (inputs.current[i]) {
        inputs.current[i]!.value = char
      }
    })
    inputs.current[Math.min(pasted.length, 5)]?.focus()
    e.preventDefault()
  }

  return (
    <>
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Vérification en 2 étapes</h2>
        <p className="text-sm text-gray-500">
          Saisissez le code à 6 chiffres affiché dans votre application d&apos;authentification.
        </p>
      </div>

      <form className="space-y-6">
        {/* Grille de 6 cases */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              pattern="[0-9]"
              name={`digit-${i}`}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              className="w-11 h-13 text-center text-xl font-semibold rounded-lg border-2 border-gray-300
                         focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                         transition caret-transparent"
              aria-label={`Chiffre ${i + 1}`}
            />
          ))}
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-medium text-sm
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     transition"
        >
          Vérifier
        </button>
      </form>

      <div className="mt-5 space-y-3 text-center">
        <p className="text-xs text-gray-500">
          Code valide 30 secondes · Application : Google Authenticator, Authy
        </p>
        <Link href="/login" className="block text-sm text-gray-500 hover:text-gray-700">
          ← Retour à la connexion
        </Link>
      </div>
    </>
  )
}
