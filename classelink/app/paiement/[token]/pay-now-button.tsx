'use client'

import { useState, useTransition } from 'react'
import { initiatePublicPayment } from '@/actions/public-payment'

interface Props {
  token:  string
  amount: number
}

export function PayNowButton({ token, amount }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n)

  function handlePay() {
    setError(null)
    startTransition(async () => {
      const res = await initiatePublicPayment(token)
      if (res.success) {
        window.location.href = res.data!.paymentUrl
      } else {
        setError(res.error ?? 'Erreur lors du paiement.')
      }
    })
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handlePay}
        disabled={isPending}
        className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                   text-white text-base font-bold rounded-xl transition
                   flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
      >
        {isPending ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Redirection…
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Payer {fmt(amount)} par Mobile Money
          </>
        )}
      </button>

      {/* Moyens de paiement acceptés */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-400">
        {['Wave', 'Orange Money', 'MTN Mobile Money', 'Moov Money'].map(m => (
          <span key={m} className="px-2 py-1 bg-gray-100 rounded-md font-medium">{m}</span>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 text-center">
          {error}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Vous serez redirigé vers la page sécurisée GeniusPay pour compléter le paiement.
      </p>
    </div>
  )
}
