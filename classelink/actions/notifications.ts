'use server'

import { getTenantPrisma } from '@/lib/db/tenant'
import { requireAuth } from '@/lib/auth/rbac'
import { toActionError } from '@/lib/errors'
import type { ActionResult } from '@/types'

export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  href: string | null
  read: boolean
  createdAt: string
}

export interface NotificationFeed {
  items: NotificationItem[]
  unread: number
}

const EMPTY_FEED: NotificationFeed = { items: [], unread: 0 }

function mapRow(row: any): NotificationItem {
  const data = row.data ?? {}
  const href = typeof data?.href === 'string' ? data.href : null
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href,
    read: row.read_at != null,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

// ─── Récupérer le flux de notifications de l'utilisateur courant ───────────────
export async function getNotifications(limit = 12): Promise<NotificationFeed> {
  let session
  try {
    session = await requireAuth()
  } catch {
    return EMPTY_FEED
  }

  const userId = session.user.id
  const schemaName = session.user.schemaName
  // Le super-admin n'a pas de table de notifications tenant.
  if (!userId || !schemaName) return EMPTY_FEED

  try {
    const db = getTenantPrisma(schemaName) as any
    const rows: any[] = await db.$queryRaw`
      SELECT id, type, title, body, data, read_at, created_at
      FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    const countRows: any[] = await db.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM notifications
      WHERE user_id = ${userId} AND read_at IS NULL
    `
    return {
      items: rows.map(mapRow),
      unread: Number(countRows[0]?.count ?? 0),
    }
  } catch {
    // Schéma sans table notifications (ex. super-admin) ou erreur transitoire :
    // on dégrade proprement sans casser l'en-tête.
    return EMPTY_FEED
  }
}

// ─── Marquer une notification comme lue ───────────────────────────────────────
export async function markNotificationRead(id: string): Promise<ActionResult> {
  let session
  try {
    session = await requireAuth()
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }

  const userId = session.user.id
  const schemaName = session.user.schemaName
  if (!userId || !schemaName || !id) {
    return { success: false, error: 'Notification introuvable.' }
  }

  try {
    const db = getTenantPrisma(schemaName) as any
    await db.$executeRaw`
      UPDATE notifications
      SET read_at = NOW()
      WHERE id = ${id} AND user_id = ${userId} AND read_at IS NULL
    `
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Tout marquer comme lu ────────────────────────────────────────────────────
export async function markAllNotificationsRead(): Promise<ActionResult> {
  let session
  try {
    session = await requireAuth()
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }

  const userId = session.user.id
  const schemaName = session.user.schemaName
  if (!userId || !schemaName) {
    return { success: false, error: 'Session invalide.' }
  }

  try {
    const db = getTenantPrisma(schemaName) as any
    await db.$executeRaw`
      UPDATE notifications
      SET read_at = NOW()
      WHERE user_id = ${userId} AND read_at IS NULL
    `
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}
