'use server'

import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import { revalidatePath } from 'next/cache'
import { toActionError } from '@/lib/errors'
import type { ActionResult } from '@/types'

const VALID_REWARD_TYPES = [
  'FELICITATIONS', 'ENCOURAGEMENTS', 'TABLEAU_HONNEUR',
  'PRIX', 'MENTION', 'AUTRE',
] as const

async function getDb() {
  const session = await requireRole('ADMIN', 'CENSOR')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, user: session.user }
}

// ─── Liste des récompenses ────────────────────────────────────────────────────

export async function getRewards(studentId?: string, termId?: string): Promise<any[]> {
  const { db } = await getDb()

  if (studentId && termId) {
    return db.$queryRaw`
      SELECT
        r.id, r.type, r.title, r.description, r.date,
        su.first_name AS student_first_name, su.last_name AS student_last_name,
        iu.first_name AS issuer_first_name,  iu.last_name AS issuer_last_name,
        t.name AS term_name
      FROM rewards r
      JOIN students s  ON s.id  = r.student_id
      JOIN users su    ON su.id = s.user_id
      JOIN users iu    ON iu.id = r.issued_by
      LEFT JOIN terms t ON t.id = r.term_id
      WHERE r.student_id = ${studentId}
        AND r.term_id    = ${termId}
      ORDER BY r.date DESC
    ` as Promise<any[]>
  }

  if (studentId) {
    return db.$queryRaw`
      SELECT
        r.id, r.type, r.title, r.description, r.date,
        su.first_name AS student_first_name, su.last_name AS student_last_name,
        iu.first_name AS issuer_first_name,  iu.last_name AS issuer_last_name,
        t.name AS term_name
      FROM rewards r
      JOIN students s  ON s.id  = r.student_id
      JOIN users su    ON su.id = s.user_id
      JOIN users iu    ON iu.id = r.issued_by
      LEFT JOIN terms t ON t.id = r.term_id
      WHERE r.student_id = ${studentId}
      ORDER BY r.date DESC
    ` as Promise<any[]>
  }

  if (termId) {
    return db.$queryRaw`
      SELECT
        r.id, r.type, r.title, r.description, r.date,
        su.first_name AS student_first_name, su.last_name AS student_last_name,
        iu.first_name AS issuer_first_name,  iu.last_name AS issuer_last_name,
        t.name AS term_name
      FROM rewards r
      JOIN students s  ON s.id  = r.student_id
      JOIN users su    ON su.id = s.user_id
      JOIN users iu    ON iu.id = r.issued_by
      LEFT JOIN terms t ON t.id = r.term_id
      WHERE r.term_id = ${termId}
      ORDER BY r.date DESC
    ` as Promise<any[]>
  }

  return db.$queryRaw`
    SELECT
      r.id, r.type, r.title, r.description, r.date,
      su.first_name AS student_first_name, su.last_name AS student_last_name,
      iu.first_name AS issuer_first_name,  iu.last_name AS issuer_last_name,
      t.name AS term_name
    FROM rewards r
    JOIN students s  ON s.id  = r.student_id
    JOIN users su    ON su.id = s.user_id
    JOIN users iu    ON iu.id = r.issued_by
    LEFT JOIN terms t ON t.id = r.term_id
    ORDER BY r.date DESC
  ` as Promise<any[]>
}

// ─── Créer une récompense ─────────────────────────────────────────────────────

export async function createReward(
  studentId: string,
  type: string,
  title: string,
  description: string,
  date: string,
  termId?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const { db, user } = await getDb()

    if (!studentId || !type || !title || !date) {
      return { success: false, error: 'Élève, type, titre et date sont requis.' }
    }
    if (!VALID_REWARD_TYPES.includes(type as any)) {
      return { success: false, error: 'Type de récompense invalide.' }
    }

    const rows: any[] = await db.$queryRaw`
      INSERT INTO rewards (student_id, issued_by, type, title, description, date, term_id)
      VALUES (
        ${studentId},
        ${user.id},
        ${type},
        ${title},
        ${description || null},
        ${new Date(date)},
        ${termId || null}
      )
      RETURNING id
    `

    revalidatePath('/admin/rewards')
    return { success: true, data: { id: rows[0].id } }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Supprimer une récompense ─────────────────────────────────────────────────

export async function deleteReward(id: string): Promise<ActionResult> {
  try {
    const { db } = await getDb()
    await db.$executeRaw`DELETE FROM rewards WHERE id = ${id}`
    revalidatePath('/admin/rewards')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Résumé des récompenses d'un élève ───────────────────────────────────────

export async function getStudentRewardsSummary(studentId: string): Promise<any> {
  const { db } = await getDb()

  const rows: any[] = await db.$queryRaw`
    SELECT
      type,
      COUNT(*)::int AS count
    FROM rewards
    WHERE student_id = ${studentId}
    GROUP BY type
    ORDER BY count DESC
  `

  const totalRow: any[] = await db.$queryRaw`
    SELECT COUNT(*)::int AS total
    FROM rewards
    WHERE student_id = ${studentId}
  `

  return {
    byType: rows,
    total: totalRow[0]?.total ?? 0,
  }
}
