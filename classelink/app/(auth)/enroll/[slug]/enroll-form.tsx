'use client'

import { useActionState } from 'react'
import { submitEnrollmentApplication } from '@/actions/enrollment'
import type { ActionResult } from '@/types'

interface Props { slug: string }

export function EnrollForm({ slug }: Props) {
  const boundAction = submitEnrollmentApplication.bind(null, slug)
  const [state, formAction, pending] = useActionState<
    ActionResult<{ applicationId: string }> | null,
    FormData
  >(boundAction, null)

  if (state?.success) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Candidature envoyée !</h3>
        <p className="text-gray-500 text-sm">
          Votre demande d'inscription a bien été reçue. L'établissement vous contactera
          prochainement pour vous communiquer la décision.
        </p>
        <p className="text-xs text-gray-400 mt-3">
          Référence : <span className="font-mono font-medium">{(state as any).data?.applicationId?.slice(0, 8).toUpperCase()}</span>
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="p-6 space-y-5">
      {state && !state.success && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Informations de l'élève */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">
          Informations de l'élève
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Prénom *</label>
            <input name="firstName" required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex: Kouamé" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
            <input name="lastName" required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex: YAPI" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date de naissance</label>
            <input name="dateOfBirth" type="date"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sexe</label>
            <select name="gender"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Choisir…</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Niveau souhaité</label>
            <input name="desiredLevel"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex: 6ème, 4ème, Terminale…" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Moyenne précédente /20</label>
            <input name="previousAverage" type="number" min="0" max="20" step="0.01"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex: 13.50" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">École précédente</label>
            <input name="previousSchool"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nom de l'école précédente" />
          </div>
        </div>
      </div>

      {/* Informations du parent */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">
          Informations du parent / tuteur
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Nom complet du parent *</label>
            <input name="parentName" required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex: YAPI Emmanuel" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Lien de parenté</label>
            <select name="parentRelation"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="PARENT">Père / Mère</option>
              <option value="TUTEUR">Tuteur légal</option>
              <option value="GRAND_PARENT">Grand-parent</option>
              <option value="AUTRE">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone *</label>
            <input name="parentPhone" required type="tel"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+225 07 XX XX XX XX" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input name="parentEmail" type="email"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@exemple.com" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Adresse</label>
            <input name="address"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Quartier, commune…" />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Message / informations complémentaires
        </label>
        <textarea name="notes" rows={3}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Toute information utile pour l'établissement…" />
      </div>

      <button type="submit" disabled={pending}
        className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold
                   hover:bg-blue-700 disabled:opacity-60 transition">
        {pending ? 'Envoi en cours…' : 'Soumettre ma candidature'}
      </button>
    </form>
  )
}
