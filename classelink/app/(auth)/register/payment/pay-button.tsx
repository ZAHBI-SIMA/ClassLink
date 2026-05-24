'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { initiateSubscriptionPayment } from '@/actions/register'

interface Props {
  schoolId: string
  isFree: boolean
}

export function PayButton({ schoolId, isFree }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    const res = await initiateSubscriptionPayment(schoolId)
    if (!res.success) {
      setError(res.error ?? 'Une erreur est survenue.')
      setLoading(false)
      return
    }
    if (res.data?.paymentUrl) {
      window.location.href = res.data.paymentUrl // redirection vers GeniusPay
      return
    }
    if (res.data?.redirect) {
      router.push(res.data.redirect)
      return
    }
    setLoading(false)
  }

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white
                   hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {loading
          ? 'Redirection…'
          : isFree
          ? 'Activer mon établissement'
          : 'Payer et activer mon établissement'}
      </button>
    </div>
  )
}
