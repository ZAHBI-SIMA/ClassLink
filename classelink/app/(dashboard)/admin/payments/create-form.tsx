'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createPayment } from '@/actions/admin'
import type { ActionResult } from '@/types'

interface Props {
  students: any[]
  feeTypes: any[]
}

export function PaymentCreateForm({ students, feeTypes }: Props) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    createPayment,
    null
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Enregistrer un paiement</h3>

      {state?.success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          Paiement enregistré avec succès.
        </div>
      )}
      {state && !state.success && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <form ref={formRef} action={action} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Élève</label>
          <select
            name="student_id"
            required
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Sélectionner —</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.last_name} {s.first_name} {s.class_name ? `(${s.class_name})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type de frais</label>
          <select
            name="fee_type_id"
            required
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Sélectionner —</option>
            {feeTypes.map(f => (
              <option key={f.id} value={f.id}>
                {f.name} — {Number(f.amount).toLocaleString('fr-FR')} FCFA
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Montant (FCFA)</label>
          <input
            name="amount"
            type="number"
            min="0"
            required
            placeholder="25000"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Date d&apos;échéance <span className="text-gray-400">(optionnel)</span>
          </label>
          <input
            name="due_date"
            type="date"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm
                     font-semibold rounded-lg transition disabled:opacity-50"
        >
          {isPending ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}
