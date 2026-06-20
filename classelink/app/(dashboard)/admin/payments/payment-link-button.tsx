'use client'

import { useState, useTransition } from 'react'
import { generatePaymentLink } from '@/actions/admin'

interface Props {
  paymentId: string
}

export function PaymentLinkButton({ paymentId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const res = await generatePaymentLink(paymentId)
      if (!res.success) {
        setError(res.error ?? 'Erreur')
        return
      }
      try {
        await navigator.clipboard.writeText(res.data!.url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch {
        // Fallback : ouvrir dans un nouvel onglet
        window.open(res.data!.url, '_blank')
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleGenerate}
        disabled={isPending}
        title="Générer et copier le lien de paiement Mobile Money"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition
                   disabled:opacity-60
                   bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
      >
        {isPending ? (
          <>
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Génération…
          </>
        ) : copied ? (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Lien copié !
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Lien de paiement
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-600 max-w-[160px] text-right">{error}</p>}
    </div>
  )
}
