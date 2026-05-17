'use client'

import { useActionState } from 'react'
import { createStudent } from '@/actions/admin'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { ActionResult } from '@/types'

export default function NewStudentPage() {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    createStudent,
    null
  )
  const [classes, setClasses] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/admin/classes').then(r => r.json()).then(setClasses).catch(() => {})
  }, [])

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/students"
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inscrire un élève</h2>
          <p className="text-sm text-gray-500">Remplissez les informations de l&apos;élève</p>
        </div>
      </div>

      {state?.success && (
        <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200">
          <p className="text-sm font-semibold text-green-800">✅ Élève inscrit avec succès</p>
          <p className="text-sm text-green-700 mt-1">
            N° élève : <strong>{(state as any).data?.studentId}</strong>
          </p>
          {(state as any).data?.tempPassword && (
            <p className="text-sm text-green-700 mt-0.5">
              Mot de passe temporaire : <strong className="font-mono">{(state as any).data.tempPassword}</strong>
            </p>
          )}
          <Link
            href="/admin/students"
            className="inline-block mt-3 text-sm font-medium text-green-700 underline"
          >
            Retour à la liste
          </Link>
        </div>
      )}

      {state && !state.success && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <form action={action} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
            <input
              name="firstName"
              required
              placeholder="Konan"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input
              name="lastName"
              required
              placeholder="Yao"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            name="email"
            type="email"
            required
            placeholder="konan.yao@ecole.ci"
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
            <input
              name="dateOfBirth"
              type="date"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
            <select
              name="gender"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Sélectionner —</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <input
            name="address"
            placeholder="Quartier, ville..."
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Classe (optionnel)</label>
          <select
            name="classId"
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Affecter plus tard —</option>
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Requiert une année scolaire active pour l&apos;inscription.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/admin/students"
            className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium
                       text-gray-700 hover:bg-gray-50 transition text-center"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                       text-white text-sm font-medium rounded-lg transition"
          >
            {isPending ? 'Inscription...' : 'Inscrire l\'élève'}
          </button>
        </div>
      </form>
    </div>
  )
}
