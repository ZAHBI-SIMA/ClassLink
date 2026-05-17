'use client'

import { useTransition } from 'react'
import { markPaymentPaid } from '@/actions/admin'

export function MarkPaidButton({ paymentId }: { paymentId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => markPaymentPaid(paymentId))}
      disabled={isPending}
      className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-semibold
                 hover:bg-green-200 transition disabled:opacity-50"
    >
      {isPending ? '...' : 'Marquer payé'}
    </button>
  )
}
