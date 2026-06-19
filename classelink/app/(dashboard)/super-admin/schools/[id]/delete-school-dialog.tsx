'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteSchool } from '@/actions/super-admin'

interface Props {
  schoolId:   string
  schoolName: string
}

export function DeleteSchoolDialog({ schoolId, schoolName }: Props) {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const canDelete = confirm.trim() === schoolName.trim()

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteSchool(schoolId)
      if (res.success) {
        router.push('/super-admin/schools')
      } else {
        setError(res.error ?? 'Erreur lors de la suppression.')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setConfirm(''); setError(null) }}
        className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-red-100
                   text-red-700 hover:bg-red-200 transition"
      >
        Supprimer
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Supprimer l&apos;établissement</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Cette action est irréversible</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700 space-y-1">
                <p className="font-medium">Toutes les données seront définitivement supprimées :</p>
                <ul className="list-disc list-inside text-xs space-y-0.5 text-red-600">
                  <li>Base de données complète de l&apos;établissement</li>
                  <li>Élèves, enseignants, notes et bulletins</li>
                  <li>Abonnement et historique des paiements</li>
                </ul>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Tapez <span className="font-bold text-gray-900">{schoolName}</span> pour confirmer
                </label>
                <input
                  type="text"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={schoolName}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700
                             text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!canDelete || isPending}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium
                             hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Suppression…' : 'Supprimer définitivement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
