'use client'

import { useState } from 'react'
import { initiateParentSubscriptionPayment } from '@/actions/parent'

export function PaySubscriptionButton({ label = 'Payer maintenant' }: { label?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setError(null)
    setLoading(true)
    const result = await initiateParentSubscriptionPayment()
    if (result.success && result.data) {
      window.location.href = result.data.paymentUrl
    } else {
      setLoading(false)
      if (!result.success) setError(result.error ?? 'Erreur lors de l\'initiation du paiement.')
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold
                   hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {loading ? 'Redirection…' : label}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
