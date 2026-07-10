'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerSchool } from '@/actions/register'
import type { ActionResult } from '@/types'

interface Props {
  planSlug: string
  planName: string
  planPrice: number
}

function formatXof(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}

export function RegisterForm({ planSlug, planName, planPrice }: Props) {
  const router = useRouter()
  const [state, action, pending] = useActionState<ActionResult<{ schoolId: string }> | null, FormData>(
    registerSchool,
    null
  )
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (state?.success && state.data?.schoolId) {
      router.push(`/register/payment?school=${state.data.schoolId}`)
    }
  }, [state, router])

  return (
    <>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-gray-900">Créer votre établissement</h2>
        <p className="text-sm text-gray-500 mt-1">Quelques informations pour démarrer.</p>
      </div>

      {/* Forfait sélectionné */}
      <div className="mb-5 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <div>
          <p className="text-xs text-blue-600 font-medium">Forfait sélectionné</p>
          <p className="text-sm font-bold text-gray-900">
            {planName} —{' '}
            {planPrice > 0 ? `${formatXof(planPrice)} FCFA/an` : 'Gratuit'}
          </p>
        </div>
        <Link href="/#tarifs" className="text-xs font-medium text-blue-600 hover:underline">
          Changer
        </Link>
      </div>

      {state && !state.success && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <input type="hidden" name="planSlug" value={planSlug} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nom de l’établissement <span className="text-red-500">*</span>
          </label>
          <input name="schoolName" required placeholder="Lycée Moderne de Bouaké"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville</label>
          <input name="city" placeholder="Abidjan"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input name="adminFirstName" required placeholder="Konan"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom <span className="text-red-500">*</span>
            </label>
            <input name="adminLastName" required placeholder="Beugré"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email administrateur <span className="text-red-500">*</span>
          </label>
          <input name="adminEmail" type="email" required placeholder="directeur@ecole.ci"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Mot de passe <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input name="adminPassword" type={showPassword ? 'text' : 'password'} required minLength={8}
              placeholder="8 caractères minimum"
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="button" onClick={() => setShowPassword(v => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600" tabIndex={-1}>
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <button type="submit" disabled={pending}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed transition">
          {pending || (state?.success) ? 'Création en cours…' : 'Continuer vers le paiement'}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-5">
        Vous avez déjà un compte ?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">Se connecter</Link>
      </p>
    </>
  )
}
