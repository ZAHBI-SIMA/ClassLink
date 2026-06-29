'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from '@/actions/notifications'

interface Props {
  initialItems: NotificationItem[]
  initialUnread: number
}

// Icône par type de notification
const TYPE_ICON: Record<string, string> = {
  GRADE_PUBLISHED:       'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  ABSENCE_RECORDED:      'M6 18L18 6M6 6l12 12',
  ASSIGNMENT_CREATED:    'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  ASSIGNMENT_DUE:        'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  REPORT_CARD_AVAILABLE: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  PAYMENT_RECEIVED:      'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  PAYMENT_DUE:           'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  NEW_MESSAGE:           'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  ANNOUNCEMENT:          'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
  APPOINTMENT_CONFIRMED: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
}
const DEFAULT_ICON = 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `il y a ${d} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function NotificationBell({ initialItems, initialUnread }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>(initialItems)
  const [unread, setUnread] = useState(initialUnread)
  const [isPending, startTransition] = useTransition()
  const rootRef = useRef<HTMLDivElement>(null)

  // Fermer au clic extérieur
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Rafraîchir le flux à l'ouverture du menu
  async function refresh() {
    const feed = await getNotifications()
    setItems(feed.items)
    setUnread(feed.unread)
  }

  function toggleOpen() {
    const next = !open
    setOpen(next)
    if (next) void refresh()
  }

  function handleItemClick(n: NotificationItem) {
    if (!n.read) {
      // Optimiste
      setItems(prev => prev.map(i => (i.id === n.id ? { ...i, read: true } : i)))
      setUnread(u => Math.max(0, u - 1))
      startTransition(async () => {
        await markNotificationRead(n.id)
        router.refresh()
      })
    }
    if (n.href) {
      setOpen(false)
      router.push(n.href)
    }
  }

  function handleMarkAll() {
    if (unread === 0) return
    setItems(prev => prev.map(i => ({ ...i, read: true })))
    setUnread(0)
    startTransition(async () => {
      await markAllNotificationsRead()
      router.refresh()
    })
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={toggleOpen}
        className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={DEFAULT_ICON} />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center
                           text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl
                        border border-gray-200 shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={isPending}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <svg className="mx-auto h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={DEFAULT_ICON} />
                </svg>
                <p className="mt-2 text-sm text-gray-500">Aucune notification</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {items.map(n => (
                  <li key={n.id}>
                    <button
                      onClick={() => handleItemClick(n)}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${
                        n.read ? '' : 'bg-blue-50/40'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        n.read ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d={TYPE_ICON[n.type] ?? DEFAULT_ICON} />
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm leading-tight ${
                          n.read ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'
                        }`}>
                          {n.title}
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-gray-500 line-clamp-2">
                          {n.body}
                        </span>
                        <span className="mt-1 block text-[11px] text-gray-400">{timeAgo(n.createdAt)}</span>
                      </span>
                      {!n.read && (
                        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
