'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/rbac'
import { getTenantPrisma } from '@/lib/db/tenant'
import { toActionError } from '@/lib/errors'
import type { ActionResult } from '@/types'

async function getDb() {
  const session = await requireRole('ADMIN', 'CENSOR')
  return {
    db:   getTenantPrisma(session.user.schemaName) as any,
    user: session.user,
  }
}

// ─── Liste des conseils ───────────────────────────────────────────────────────
export async function getCouncils() {
  const { db } = await getDb()

  const rows = await db.$queryRaw`
    SELECT
      cc.id,
      cc.status,
      cc.scheduled_at,
      cc.held_at,
      cc.president,
      cc.general_notes,
      c.name   AS class_name,
      t.name   AS term_name,
      t.term_order,
      ay.name  AS academic_year_name,
      (SELECT COUNT(*) FROM council_students cs WHERE cs.council_id = cc.id) AS student_count,
      (SELECT COUNT(*) FROM council_students cs WHERE cs.council_id = cc.id AND cs.decision != 'PASSAGE') AS flagged_count
    FROM class_councils cc
    JOIN classes       c  ON cc.class_id         = c.id
    JOIN terms         t  ON cc.term_id           = t.id
    LEFT JOIN academic_years ay ON cc.academic_year_id = ay.id
    ORDER BY cc.scheduled_at DESC NULLS LAST, c.name, t.term_order
  `
  return rows as any[]
}

// ─── Détail d'un conseil (avec décisions par élève) ───────────────────────────
export async function getCouncilDetails(councilId: string) {
  const { db } = await getDb()

  const [councils, students] = await Promise.all([
    db.$queryRaw`
      SELECT
        cc.*,
        c.name  AS class_name,
        t.name  AS term_name,
        ay.name AS academic_year_name
      FROM class_councils cc
      JOIN classes       c  ON cc.class_id         = c.id
      JOIN terms         t  ON cc.term_id           = t.id
      LEFT JOIN academic_years ay ON cc.academic_year_id = ay.id
      WHERE cc.id = ${councilId}
      LIMIT 1
    `,
    db.$queryRaw`
      SELECT
        s.id         AS student_id,
        u.first_name,
        u.last_name,
        s.student_id AS student_number,
        cs.id        AS decision_id,
        cs.average,
        cs.rank,
        cs.decision,
        cs.appreciation,
        cs.council_comment,
        cs.absences_count,
        -- Calculer la moyenne automatiquement si pas encore enregistrée
        COALESCE(
          cs.average,
          (
            SELECT ROUND(AVG(g.value * ls.coefficient / g.max_value * 20)::numeric, 2)
            FROM grades g
            JOIN level_subjects ls ON g.subject_id = ls.subject_id
            WHERE g.student_id = s.id
              AND g.term_id    = (SELECT term_id FROM class_councils WHERE id = ${councilId})
          )
        ) AS computed_average,
        -- Compter les absences du trimestre
        COALESCE(
          cs.absences_count,
          (
            SELECT COUNT(*)
            FROM attendances a
            WHERE a.student_id = s.id
              AND a.status IN ('ABSENT','LATE')
          )
        ) AS total_absences
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN enrollments e ON e.student_id = s.id
      JOIN classes cl ON e.class_id = cl.id
      JOIN class_councils cc ON cc.class_id = cl.id AND cc.id = ${councilId}
      LEFT JOIN council_students cs ON cs.council_id = ${councilId} AND cs.student_id = s.id
      WHERE e.status = 'ACTIVE'
      ORDER BY u.last_name, u.first_name
    `,
  ])

  const council = (councils as any[])[0] ?? null
  return { council, students: students as any[] }
}

// ─── Créer un conseil ─────────────────────────────────────────────────────────
export async function createCouncil(
  prevState: ActionResult<{ id: string }> | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const { db, user } = await getDb()

  const classId       = formData.get('classId')      as string
  const termId        = formData.get('termId')        as string
  const scheduledAt   = formData.get('scheduledAt')   as string
  const president     = formData.get('president')     as string
  const academicYearId = formData.get('academicYearId') as string

  if (!classId || !termId) {
    return { success: false, error: 'Classe et trimestre requis.' }
  }

  try {
    const rows = await db.$queryRaw`
      INSERT INTO class_councils (class_id, term_id, academic_year_id, scheduled_at, president, created_by, status)
      VALUES (
        ${classId}, ${termId},
        ${academicYearId || null},
        ${scheduledAt ? new Date(scheduledAt) : null},
        ${president || null},
        ${user.id},
        'PLANNED'
      )
      ON CONFLICT (class_id, term_id) DO UPDATE
        SET scheduled_at = EXCLUDED.scheduled_at,
            president    = EXCLUDED.president,
            updated_at   = NOW()
      RETURNING id
    `
    const id = (rows as any[])[0]?.id
    revalidatePath('/admin/councils')
    return { success: true, data: { id } }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Mettre à jour le statut d'un conseil ────────────────────────────────────
export async function updateCouncilStatus(
  councilId: string,
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED',
  notes?: string
): Promise<ActionResult> {
  const { db } = await getDb()
  try {
    await db.$executeRaw`
      UPDATE class_councils
      SET status        = ${status},
          general_notes = COALESCE(${notes ?? null}, general_notes),
          held_at       = CASE WHEN ${status} = 'COMPLETED' THEN NOW() ELSE held_at END,
          updated_at    = NOW()
      WHERE id = ${councilId}
    `
    revalidatePath('/admin/councils')
    revalidatePath(`/admin/councils/${councilId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Sauvegarder les décisions du conseil ─────────────────────────────────────
export async function saveCouncilDecisions(
  councilId: string,
  decisions: {
    studentId:      string
    average:        number | null
    rank:           number | null
    decision:       string
    appreciation:   string
    councilComment: string
    absencesCount:  number
  }[]
): Promise<ActionResult> {
  const { db } = await getDb()
  try {
    for (const d of decisions) {
      await db.$executeRaw`
        INSERT INTO council_students
          (council_id, student_id, average, rank, decision, appreciation, council_comment, absences_count)
        VALUES
          (${councilId}, ${d.studentId}, ${d.average}, ${d.rank},
           ${d.decision}, ${d.appreciation}, ${d.councilComment}, ${d.absencesCount})
        ON CONFLICT (council_id, student_id) DO UPDATE
          SET average         = EXCLUDED.average,
              rank            = EXCLUDED.rank,
              decision        = EXCLUDED.decision,
              appreciation    = EXCLUDED.appreciation,
              council_comment = EXCLUDED.council_comment,
              absences_count  = EXCLUDED.absences_count
      `
    }
    revalidatePath(`/admin/councils/${councilId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Données pour créer un conseil (classes + trimestres) ────────────────────
export async function getCouncilFormData() {
  const { db } = await getDb()

  const [classes, terms] = await Promise.all([
    db.$queryRaw`
      SELECT c.id, c.name, ay.name AS academic_year_name, ay.id AS academic_year_id
      FROM classes c
      JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE ay.is_current = TRUE
      ORDER BY c.name
    `,
    db.$queryRaw`
      SELECT t.id, t.name, t.term_order, ay.id AS academic_year_id
      FROM terms t
      JOIN academic_years ay ON t.academic_year_id = ay.id
      WHERE ay.is_current = TRUE
      ORDER BY t.term_order
    `,
  ])

  return { classes: classes as any[], terms: terms as any[] }
}

// ─── Supprimer un conseil ─────────────────────────────────────────────────────
export async function deleteCouncil(councilId: string): Promise<ActionResult> {
  const { db } = await getDb()
  try {
    await db.$executeRaw`DELETE FROM class_councils WHERE id = ${councilId}`
    revalidatePath('/admin/councils')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}
