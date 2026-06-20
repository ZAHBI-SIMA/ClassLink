'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { deleteParent } from '@/actions/admin'

interface Props {
  parentId:   string
  parentName: string
}

export function DeleteParentDialog({ parentId, parentName }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen]         = useState(false)
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')

  function handleDelete() {
    if (confirm !== parentName) return
    setError('')
    startTransition(async () => {
      const res = await deleteParent(parentId)
      if (!res.success) setError(res.error ?? 'Erreur')
      else router.push('/admin/parents')
    })
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-red-200 p-5">
        <h3 className="text-sm font-semibold text-red-700 mb-3">Zone dangereuse</h3>
        <p className="text-xs text-gray-500 mb-3">
          La suppression du parent est irréversible. Son compte et tous ses liens avec les élèves seront effacés.
        </p>
        <button
          onClick={() => { setOpen(true); setConfirm(''); setError('') }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
        >
          Supprimer le parent
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-gray-900">Supprimer le parent</h2>
            </div>

            <p className="text-sm text-gray-600">
              Cette action est <strong>irréversible</strong>. Le compte de{' '}
              <strong>{parentName}</strong> et tous ses liens avec les élèves seront supprimés définitivement.
            </p>
            <p className="text-sm text-gray-600">
              Tapez <strong className="font-mono bg-gray-100 px-1 rounded">{parentName}</strong> pour confirmer :
            </p>
            <input
              type="text"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder={parentName}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={pending || confirm !== parentName}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
              >
                {pending ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
