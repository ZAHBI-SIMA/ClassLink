'use server'

import { revalidatePath } from 'next/cache'
import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import type { ActionResult } from '@/types'

async function getDb(roles: string[]) {
  const session = await (requireRole as any)(...roles)
  return { db: getTenantPrisma(session.user.schemaName) as any, session }
}

export async function getAnnouncements(): Promise<any[]> {
  const { db } = await getDb(['ADMIN', 'CENSOR', 'TEACHER', 'PARENT', 'STUDENT'])
  return db.$queryRaw`
    SELECT a.*, u.first_name AS author_first_name, u.last_name AS author_last_name
    FROM announcements a
    LEFT JOIN users u ON u.id = a.author_id
    WHERE (a.expires_at IS NULL OR a.expires_at > NOW())
    ORDER BY a.is_pinned DESC, a.created_at DESC
  ` as Promise<any[]>
}

export async function getAnnouncementsAdmin(): Promise<any[]> {
  const { db } = await getDb(['ADMIN', 'CENSOR'])
  return db.$queryRaw`
    SELECT a.*, u.first_name AS author_first_name, u.last_name AS author_last_name
    FROM announcements a
    LEFT JOIN users u ON u.id = a.author_id
    ORDER BY a.is_pinned DESC, a.created_at DESC
  ` as Promise<any[]>
}

export async function createAnnouncement(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { db, session } = await getDb(['ADMIN', 'CENSOR'])

    const title = (formData.get('title') as string)?.trim()
    const content = (formData.get('content') as string)?.trim()
    const targetRoles = formData.getAll('target_roles') as string[]
    const classIdRaw = formData.get('class_id') as string
    const classId = classIdRaw?.trim() || null
    const isPinned = formData.get('is_pinned') === 'on'
    const expiresAtRaw = formData.get('expires_at') as string
    const expiresAt = expiresAtRaw?.trim() ? new Date(expiresAtRaw) : null

    if (!title) return { success: false, error: 'Le titre est requis.' }
    if (!content) return { success: false, error: 'Le contenu est requis.' }

    const targetRolesJson = JSON.stringify(targetRoles.length > 0 ? targetRoles : ['TEACHER', 'PARENT', 'STUDENT'])
    const authorId = session.user.id

    if (classId && expiresAt) {
      await db.$executeRaw`
        INSERT INTO announcements (title, content, author_id, target_roles, class_id, is_pinned, expires_at)
        VALUES (${title}, ${content}, ${authorId}, ${targetRolesJson}::jsonb, ${classId}, ${isPinned}, ${expiresAt})
      `
    } else if (classId) {
      await db.$executeRaw`
        INSERT INTO announcements (title, content, author_id, target_roles, class_id, is_pinned)
        VALUES (${title}, ${content}, ${authorId}, ${targetRolesJson}::jsonb, ${classId}, ${isPinned})
      `
    } else if (expiresAt) {
      await db.$executeRaw`
        INSERT INTO announcements (title, content, author_id, target_roles, is_pinned, expires_at)
        VALUES (${title}, ${content}, ${authorId}, ${targetRolesJson}::jsonb, ${isPinned}, ${expiresAt})
      `
    } else {
      await db.$executeRaw`
        INSERT INTO announcements (title, content, author_id, target_roles, is_pinned)
        VALUES (${title}, ${content}, ${authorId}, ${targetRolesJson}::jsonb, ${isPinned})
      `
    }

    revalidatePath('/admin/announcements')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Une erreur est survenue.' }
  }
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  try {
    const { db } = await getDb(['ADMIN', 'CENSOR'])
    await db.$executeRaw`DELETE FROM announcements WHERE id = ${id}`
    revalidatePath('/admin/announcements')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Une erreur est survenue.' }
  }
}

export async function togglePin(id: string): Promise<ActionResult> {
  try {
    const { db } = await getDb(['ADMIN', 'CENSOR'])
    await db.$executeRaw`
      UPDATE announcements SET is_pinned = NOT is_pinned WHERE id = ${id}
    `
    revalidatePath('/admin/announcements')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Une erreur est survenue.' }
  }
}
