'use client'

import { useActionState, useEffect, useRef } from 'react'
import { loanBook } from '@/actions/library'
import type { ActionResult } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  bookId: string
  bookTitle: string
}

// Wrapper action for useActionState — binds bookId dynamically
async function loanBookAction(
  prevState: ActionResult<{ id: string }> | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const bookId       = formData.get('bookId')       as string
  const borrowerType = formData.get('borrowerType') as 'student' | 'teacher'
  const borrowerId   = formData.get('borrowerId')   as string
  const dueDate      = formData.get('dueDate')      as string
  return loanBook(bookId, borrowerType, borrowerId, dueDate)
}

export function LoanModal({ open, onClose, bookId, bookTitle }: Props) {
  const [state, formAction, pending] = useActionState<ActionResult<{ id: string }> | null, FormData>(
    loanBookAction,
    null
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      onClose()
    }
  }, [state, onClose])

  if (!open) return null

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const defaultDue = new Date()
  defaultDue.setDate(defaultDue.getDate() + 14)
  const defaultDueStr = defaultDue.toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Prêt de livre</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{bookTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form ref={formRef} action={formAction} className="px-6 py-5 space-y-4">
          {state && !state.success && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          {/* Champ caché bookId */}
          <input type="hidden" name="bookId" value={bookId} />

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="lm-borrowerType">
              Type d&apos;emprunteur
            </label>
            <select
              id="lm-borrowerType"
              name="borrowerType"
              required
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="student">Élève</option>
              <option value="teacher">Enseignant</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="lm-borrowerId">
              ID de l&apos;emprunteur <span className="text-red-500">*</span>
            </label>
            <input
              id="lm-borrowerId"
              name="borrowerId"
              type="text"
              required
              placeholder="UUID de l'élève ou de l'enseignant"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">
              Saisissez l&apos;identifiant unique de l&apos;emprunteur.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="lm-dueDate">
              Date de retour prévue <span className="text-red-500">*</span>
            </label>
            <input
              id="lm-dueDate"
              name="dueDate"
              type="date"
              required
              min={minDate.toISOString().split('T')[0]}
              defaultValue={defaultDueStr}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600
                         hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium
                         hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {pending ? 'Enregistrement…' : 'Enregistrer le prêt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
