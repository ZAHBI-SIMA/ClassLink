'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createBook } from '@/actions/library'
import type { ActionResult } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
}

const initialState: ActionResult<{ id: string }> | null = null

export function BookModal({ open, onClose }: Props) {
  const [state, formAction, pending] = useActionState<ActionResult<{ id: string }> | null, FormData>(
    createBook,
    initialState
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      onClose()
    }
  }, [state, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Ajouter un livre</h2>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="bm-title">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                id="bm-title"
                name="title"
                type="text"
                required
                placeholder="Titre du livre"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="bm-author">
                Auteur <span className="text-red-500">*</span>
              </label>
              <input
                id="bm-author"
                name="author"
                type="text"
                required
                placeholder="Nom de l'auteur"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="bm-isbn">
                ISBN
              </label>
              <input
                id="bm-isbn"
                name="isbn"
                type="text"
                placeholder="978-..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="bm-category">
                Catégorie
              </label>
              <input
                id="bm-category"
                name="category"
                type="text"
                placeholder="Roman, Science, Histoire…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="bm-quantity">
                Quantité
              </label>
              <input
                id="bm-quantity"
                name="quantity"
                type="number"
                min={1}
                defaultValue={1}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="bm-location">
                Emplacement
              </label>
              <input
                id="bm-location"
                name="location"
                type="text"
                placeholder="Rayon A, Étagère 3…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="bm-description">
                Description
              </label>
              <textarea
                id="bm-description"
                name="description"
                rows={2}
                placeholder="Résumé ou note…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
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
              {pending ? 'Enregistrement…' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
