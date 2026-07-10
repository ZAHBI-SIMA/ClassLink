'use client'

import { useState, useTransition } from 'react'
import { initiateOnlinePayment } from '@/actions/parent'

interface Props {
  paymentId: string
  studentId: string
  amount: number
  feeName: string
  /** false si l'établissement n'a configuré aucun fournisseur de paiement — le bouton reste grisé. */
  paymentAvailable: boolean
}

export function PayOnlineButton({ paymentId, studentId, amount, feeName, paymentAvailable }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handlePay() {
    setError(null)
    startTransition(async () => {
      const res = await initiateOnlinePayment(paymentId, studentId)
      if (res.success) {
        window.location.href = res.data!.paymentUrl
      } else {
        setError(('error' in res ? res.error : null) ?? 'Erreur lors du paiement.')
      }
    })
  }

  if (!paymentAvailable) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-400
                     text-xs font-semibold rounded-lg cursor-not-allowed"
          title="Paiement en ligne non disponible — votre établissement n'a pas encore activé de fournisseur de paiement."
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          </svg>
          Paiement en ligne indisponible
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handlePay}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700
                   disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
        title={`Payer ${feeName} en ligne`}
      >
        {isPending ? (
          <>
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Redirection...
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
            Payer en ligne
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-600 max-w-[160px] text-right">{error}</p>}
    </div>
  )
}
