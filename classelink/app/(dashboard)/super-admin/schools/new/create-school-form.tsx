'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createSchool } from '@/actions/super-admin'
import type { ActionResult } from '@/types'

interface Props {
  plans: { id: string; name: string; priceMonthly: number; maxStudents: number }[]
}

export function CreateSchoolForm({ plans }: Props) {
  const router = useRouter()
  const [state, action, isPending] = useActionState<
    ActionResult<{ schoolId: string; slug: string }> | null,
    FormData
  >(createSchool, null)

  useEffect(() => {
    if (state?.success) {
      router.push('/super-admin/schools')
    }
  }, [state, router])

  return (
    <form action={action} className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

      {/* Section école */}
      <div className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Informations de l&apos;établissement</h3>

        {state && !state.success && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {state.error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom de l&apos;établissement <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            required
            placeholder="Lycée Moderne d'Abidjan"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <input
              name="city"
              placeholder="Abidjan"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none
                         focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              name="phone"
              type="tel"
              placeholder="+225 07 XX XX XX XX"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none
                         focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plan tarifaire <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plans.map(plan => (
              <label key={plan.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer
                           hover:border-blue-300 hover:bg-blue-50 transition has-[:checked]:border-blue-500
                           has-[:checked]:bg-blue-50">
                <input
                  type="radio"
                  name="planId"
                  value={plan.id}
                  required
                  defaultChecked={plan.priceMonthly === 0}
                  className="mt-0.5 accent-blue-600"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
                  <p className="text-xs text-gray-500">
                    {plan.priceMonthly === 0 ? 'Gratuit' : `${plan.priceMonthly.toLocaleString()} FCFA/mois`}
                  </p>
                  <p className="text-xs text-gray-400">
                    {plan.maxStudents === -1 ? 'Élèves illimités' : `Max ${plan.maxStudents} élèves`}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Section administrateur */}
      <div className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Compte administrateur (Directeur)</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              name="adminFirstName"
              required
              placeholder="Kouamé"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none
                         focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              name="adminLastName"
              required
              placeholder="Koffi"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none
                         focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            name="adminEmail"
            type="email"
            required
            placeholder="directeur@lycee.ci"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none
                       focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe provisoire <span className="text-red-500">*</span>
          </label>
          <input
            name="adminPassword"
            type="password"
            required
            minLength={8}
            placeholder="Minimum 8 caractères"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none
                       focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            L&apos;administrateur pourra modifier ce mot de passe à sa première connexion.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-5 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
        <a href="/super-admin/schools"
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700
                     hover:bg-gray-100 transition">
          Annuler
        </a>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium
                     hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-2"
        >
          {isPending ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Création...
            </>
          ) : (
            'Créer l\'établissement'
          )}
        </button>
      </div>
    </form>
  )
}
