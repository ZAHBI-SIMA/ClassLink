'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { autoLoginAfterPayment } from '@/actions/register'

export function AutoLogin({ schoolId }: { schoolId: string }) {
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    autoLoginAfterPayment(schoolId)
      .then(res => {
        // En cas de succès, signIn redirige déjà ; on n'arrive ici qu'en cas d'erreur.
        if (res && !res.success) setError(res.error ?? 'Connexion impossible.')
      })
      .catch(() => setError('Connexion impossible pour le moment.'))
  }, [schoolId])

  if (error) {
    return (
      <div className="mt-6">
        <p className="text-sm text-gray-500">{error}</p>
        <Link href="/login"
          className="mt-4 inline-block rounded-xl bg-blue-600 px-7 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          Se connecter manuellement
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <svg className="h-6 w-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-sm text-gray-500">Connexion à votre espace…</p>
    </div>
  )
}
