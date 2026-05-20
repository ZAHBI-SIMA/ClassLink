'use server'

import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import { revalidatePath } from 'next/cache'
import { toActionError } from '@/lib/errors'
import type { ActionResult } from '@/types'

const VALID_SCHOLARSHIP_TYPES    = ['BOURSE_ETAT', 'BOURSE_INTERNE', 'REDUCTION', 'EXONERATION', 'AIDE_SOCIALE'] as const
const VALID_SCHOLARSHIP_STATUSES = ['ACTIVE', 'SUSPENDED', 'TERMINATED'] as const

async function getDb() {
  const session = await requireRole('ADMIN', 'CENSOR')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, user: session.user }
}

// ─── Liste des bourses ────────────────────────────────────────────────────────

export async function getScholarships(academicYearId?: string): Promise<any[]> {
  const { db } = await getDb()

  if (academicYearId) {
    return db.$queryRaw`
      SELECT
        sc.id, sc.type, sc.label, sc.amount, sc.percentage, sc.reason, sc.status,
        su.first_name AS student_first_name, su.last_name AS student_last_name,
        ay.name AS academic_year_name
      FROM scholarships sc
      JOIN students s  ON s.id  = sc.student_id
      JOIN users su    ON su.id = s.user_id
      JOIN academic_years ay ON ay.id = sc.academic_year_id
      WHERE sc.academic_year_id = ${academicYearId}
      ORDER BY su.last_name, su.first_name
    ` as Promise<any[]>
  }

  return db.$queryRaw`
    SELECT
      sc.id, sc.type, sc.label, sc.amount, sc.percentage, sc.reason, sc.status,
      su.first_name AS student_first_name, su.last_name AS student_last_name,
      ay.name AS academic_year_name
    FROM scholarships sc
    JOIN students s  ON s.id  = sc.student_id
    JOIN users su    ON su.id = s.user_id
    JOIN academic_years ay ON ay.id = sc.academic_year_id
    ORDER BY ay.start_date DESC, su.last_name, su.first_name
  ` as Promise<any[]>
}

// ─── Créer une bourse ─────────────────────────────────────────────────────────

export async function createScholarship(
  studentId: string,
  type: string,
  label: string,
  amount: number | null,
  percentage: number | null,
  reason: string,
  academicYearId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const { db } = await getDb()

    if (!studentId || !type || !label || !academicYearId) {
      return { success: false, error: 'Élève, type, libellé et année scolaire sont requis.' }
    }
    if (!VALID_SCHOLARSHIP_TYPES.includes(type as any)) {
      return { success: false, error: 'Type de bourse invalide.' }
    }

    const rows: any[] = await db.$queryRaw`
      INSERT INTO scholarships (student_id, academic_year_id, type, label, amount, percentage, reason, status)
      VALUES (
        ${studentId},
        ${academicYearId},
        ${type},
        ${label},
        ${amount ?? null},
        ${percentage ?? null},
        ${reason || null},
        'ACTIVE'
      )
      RETURNING id
    `

    revalidatePath('/admin/scholarships')
    return { success: true, data: { id: rows[0].id } }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Mettre à jour le statut d'une bourse ────────────────────────────────────

export async function updateScholarshipStatus(id: string, status: string): Promise<ActionResult> {
  try {
    const { db } = await getDb()
    if (!VALID_SCHOLARSHIP_STATUSES.includes(status as any)) {
      return { success: false, error: 'Statut de bourse invalide.' }
    }
    await db.$executeRaw`
      UPDATE scholarships
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `
    revalidatePath('/admin/scholarships')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Supprimer une bourse ─────────────────────────────────────────────────────

export async function deleteScholarship(id: string): Promise<ActionResult> {
  try {
    const { db } = await getDb()
    await db.$executeRaw`DELETE FROM scholarships WHERE id = ${id}`
    revalidatePath('/admin/scholarships')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}
