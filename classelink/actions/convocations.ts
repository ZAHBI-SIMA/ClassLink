'use server'

import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import { revalidatePath } from 'next/cache'
import { toActionError } from '@/lib/errors'
import type { ActionResult } from '@/types'

const VALID_CONVOCATION_TYPES   = ['DISCIPLINAIRE', 'ACADEMIQUE', 'ADMINISTRATIF', 'AUTRE'] as const
const VALID_CONVOCATION_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const

async function getDb() {
  const session = await requireRole('ADMIN', 'CENSOR')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, user: session.user }
}

// ─── Liste des convocations ───────────────────────────────────────────────────

export async function getConvocations(status?: string): Promise<any[]> {
  const { db } = await getDb()

  if (status && status !== 'ALL') {
    return db.$queryRaw`
      SELECT
        c.id, c.type, c.reason, c.scheduled_at, c.location, c.status,
        su.first_name AS student_first_name, su.last_name AS student_last_name,
        pu.first_name AS parent_first_name,  pu.last_name AS parent_last_name,
        iu.first_name AS issuer_first_name,  iu.last_name AS issuer_last_name
      FROM convocations c
      JOIN students s  ON s.id  = c.student_id
      JOIN users su    ON su.id = s.user_id
      JOIN users iu    ON iu.id = c.issued_by
      LEFT JOIN parents pa  ON pa.id  = c.parent_id
      LEFT JOIN users pu    ON pu.id  = pa.user_id
      WHERE c.status = ${status}
      ORDER BY c.scheduled_at DESC
    ` as Promise<any[]>
  }

  return db.$queryRaw`
    SELECT
      c.id, c.type, c.reason, c.scheduled_at, c.location, c.status,
      su.first_name AS student_first_name, su.last_name AS student_last_name,
      pu.first_name AS parent_first_name,  pu.last_name AS parent_last_name,
      iu.first_name AS issuer_first_name,  iu.last_name AS issuer_last_name
    FROM convocations c
    JOIN students s  ON s.id  = c.student_id
    JOIN users su    ON su.id = s.user_id
    JOIN users iu    ON iu.id = c.issued_by
    LEFT JOIN parents pa  ON pa.id  = c.parent_id
    LEFT JOIN users pu    ON pu.id  = pa.user_id
    ORDER BY c.scheduled_at DESC
  ` as Promise<any[]>
}

// ─── Créer une convocation ────────────────────────────────────────────────────

export async function createConvocation(
  studentId: string,
  parentId: string | null,
  type: string,
  reason: string,
  scheduledAt: string,
  location: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const { db, user } = await getDb()

    if (!studentId || !type || !reason || !scheduledAt || !location) {
      return { success: false, error: 'Élève, type, motif, date et lieu sont requis.' }
    }
    if (!VALID_CONVOCATION_TYPES.includes(type as any)) {
      return { success: false, error: 'Type de convocation invalide.' }
    }

    const rows: any[] = await db.$queryRaw`
      INSERT INTO convocations (student_id, parent_id, issued_by, type, reason, scheduled_at, location, status)
      VALUES (
        ${studentId},
        ${parentId || null},
        ${user.id},
        ${type},
        ${reason},
        ${new Date(scheduledAt)},
        ${location},
        'PENDING'
      )
      RETURNING id
    `

    revalidatePath('/admin/convocations')
    return { success: true, data: { id: rows[0].id } }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Mettre à jour le statut d'une convocation ───────────────────────────────

export async function updateConvocationStatus(id: string, status: string): Promise<ActionResult> {
  try {
    const { db } = await getDb()
    if (!VALID_CONVOCATION_STATUSES.includes(status as any)) {
      return { success: false, error: 'Statut de convocation invalide.' }
    }
    await db.$executeRaw`
      UPDATE convocations
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `
    revalidatePath('/admin/convocations')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Supprimer une convocation ────────────────────────────────────────────────

export async function deleteConvocation(id: string): Promise<ActionResult> {
  try {
    const { db } = await getDb()
    await db.$executeRaw`DELETE FROM convocations WHERE id = ${id}`
    revalidatePath('/admin/convocations')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}
