'use client'

import { useTransition, useState } from 'react'
import { sendPaymentReminderSMS } from '@/actions/enrollment'

interface Props {
  paymentId:   string
  parentPhone: string
  studentName: string
  amount:      string
  dueDate:     string
}

export function ReminderButton({ paymentId, parentPhone, studentName, amount, dueDate }: Props) {
  const [isPending, startTransition] = useTransition()
  const [sent, setSent]              = useState(false)
  const [error, setError]            = useState<string | null>(null)

  const handleSend = () => {
    startTransition(async () => {
      const res = await sendPaymentReminderSMS(parentPhone, studentName, amount, dueDate)
      if (res.success) {
        setSent(true)
        setTimeout(() => setSent(false), 5000)
      } else {
        setError(res.error ?? 'Erreur')
        setTimeout(() => setError(null), 4000)
      }
    })
  }

  if (sent) {
    return <span className="text-xs text-green-600 font-medium">✓ SMS envoyé</span>
  }
  if (error) {
    return <span className="text-xs text-red-600">{error}</span>
  }

  return (
    <button
      onClick={handleSend}
      disabled={isPending}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-orange-300
                 text-orange-700 text-xs font-medium hover:bg-orange-50 transition disabled:opacity-50"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      {isPending ? 'Envoi…' : 'Relance SMS'}
    </button>
  )
}
