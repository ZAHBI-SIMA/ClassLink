'use client'

import { useTransition } from 'react'
import { deleteAnnouncement, togglePin } from '@/actions/announcements'

interface AnnouncementActionsProps {
  id: string
  isPinned: boolean
}

export function AnnouncementActions({ id, isPinned }: AnnouncementActionsProps) {
  const [deletePending, startDelete] = useTransition()
  const [pinPending, startPin] = useTransition()

  function handleDelete() {
    if (!confirm('Supprimer cette annonce ?')) return
    startDelete(async () => {
      await deleteAnnouncement(id)
    })
  }

  function handleTogglePin() {
    startPin(async () => {
      await togglePin(id)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleTogglePin}
        disabled={pinPending}
        title={isPinned ? 'Désépingler' : 'Épingler'}
        className={`p-1.5 rounded-lg transition disabled:opacity-50 ${
          isPinned
            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        <svg className="w-4 h-4" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </button>

      <button
        onClick={handleDelete}
        disabled={deletePending}
        title="Supprimer"
        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}
