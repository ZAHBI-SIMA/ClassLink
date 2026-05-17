'use client'

import { useTransition } from 'react'
import { deleteScheduleSlot } from '@/actions/admin'

export function DeleteSlotButton({ slotId }: { slotId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => { await deleteScheduleSlot(slotId) })}
      className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-40"
      title="Supprimer"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
}
