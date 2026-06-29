'use server'

import { getTenantPrisma } from '@/lib/db/tenant'
import { withRetry } from '@/lib/db/retry'
import { requireRole } from '@/lib/auth/rbac'
import { revalidatePath } from 'next/cache'
import { toActionError } from '@/lib/errors'
import type { ActionResult } from '@/types'

async function getDb() {
  const session = await requireRole('ADMIN', 'CENSOR')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, user: session.user }
}

async function getAnyRoleDb() {
  const session = await requireRole('ADMIN', 'CENSOR', 'PARENT', 'TEACHER', 'STUDENT')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, user: session.user }
}

// ─── Données complètes d'un bulletin ─────────────────────────────────────────
export async function getBulletinData(
  studentId: string,
  termId: string
): Promise<ActionResult<any>> {
  try {
    return await withRetry(() => fetchBulletinData(studentId, termId))
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

async function fetchBulletinData(
  studentId: string,
  termId: string
): Promise<ActionResult<any>> {
    const session = await requireRole('ADMIN', 'CENSOR', 'PARENT', 'TEACHER', 'STUDENT')
    const db = getTenantPrisma(session.user.schemaName) as any

    // Si PARENT : vérifier la parenté
    if (session.user.role === 'PARENT') {
      const check: any[] = await db.$queryRaw`
        SELECT ps.id FROM parent_students ps
        JOIN parents p ON p.id = ps.parent_id
        WHERE p.user_id = ${session.user.id} AND ps.student_id = ${studentId}
        LIMIT 1
      `
      if (!check[0]) return { success: false, error: 'Accès non autorisé.' }
    }

    // Si STUDENT : vérifier qu'il accède uniquement à son propre bulletin
    if (session.user.role === 'STUDENT') {
      const check: any[] = await db.$queryRaw`
        SELECT id FROM students WHERE id = ${studentId} AND user_id = ${session.user.id} LIMIT 1
      `
      if (!check[0]) return { success: false, error: 'Accès non autorisé.' }
    }

    // Infos élève
    const studentRows: any[] = await db.$queryRaw`
      SELECT
        u.first_name, u.last_name, s.student_id AS student_number,
        s.date_of_birth,
        c.name  AS class_name,
        l.name  AS level_name,
        ay.name AS year_name,
        c.id    AS class_id,
        l.id    AS level_id,
        ay.id   AS academic_year_id
      FROM students s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN enrollments e   ON e.student_id = s.id AND e.status = 'ACTIVE'
      LEFT JOIN classes c       ON c.id = e.class_id
      LEFT JOIN levels l        ON l.id = c.level_id
      LEFT JOIN academic_years ay ON ay.is_current = TRUE
      WHERE s.id = ${studentId}
      LIMIT 1
    `
    const student = studentRows[0] ?? null
    if (!student) return { success: false, error: 'Élève introuvable.' }

    // Infos trimestre
    const termRows: any[] = await db.$queryRaw`
      SELECT id, name, term_order FROM terms WHERE id = ${termId} LIMIT 1
    `
    const term = termRows[0] ?? null

    // Paramètres école
    const settingRows: any[] = await db.$queryRaw`
      SELECT school_name, director_name AS principal_name, address, city, phone, email, logo_url
      FROM school_settings LIMIT 1
    `
    const school = settingRows[0] ?? { school_name: null, principal_name: null }

    // Notes par matière
    const subjects: any[] = await db.$queryRaw`
      SELECT
        sub.id   AS subject_id,
        sub.name AS subject_name,
        COALESCE(ls.coefficient, 1)::float AS coefficient,
        ROUND(
          SUM(g.value * g.coefficient)::numeric / NULLIF(SUM(g.coefficient), 0),
          2
        ) AS subject_avg,
        COUNT(g.id)::int AS grade_count
      FROM grades g
      JOIN subjects sub ON sub.id = g.subject_id
      LEFT JOIN level_subjects ls
        ON ls.subject_id = g.subject_id
        AND ls.level_id  = ${student.level_id}
      WHERE g.student_id = ${studentId}
        AND g.term_id    = ${termId}
      GROUP BY sub.id, sub.name, ls.coefficient
      ORDER BY sub.name
    `

    // Moyenne générale de l'élève
    const avgRows: any[] = await db.$queryRaw`
      SELECT
        ROUND(
          SUM(t.subject_avg * t.coef)::numeric / NULLIF(SUM(t.coef), 0),
          2
        ) AS general_average
      FROM (
        SELECT
          g.subject_id,
          SUM(g.value * g.coefficient) / NULLIF(SUM(g.coefficient), 0) AS subject_avg,
          COALESCE(ls.coefficient, 1) AS coef
        FROM grades g
        LEFT JOIN level_subjects ls
          ON ls.subject_id = g.subject_id
          AND ls.level_id  = ${student.level_id}
        WHERE g.student_id = ${studentId}
          AND g.term_id    = ${termId}
        GROUP BY g.subject_id, ls.coefficient
      ) t
    `
    const general_average = avgRows[0]?.general_average ?? null

    // Moyenne de la classe
    const classAvgRows: any[] = await db.$queryRaw`
      SELECT
        ROUND(AVG(student_avg)::numeric, 2) AS class_average
      FROM (
        SELECT
          t.student_id,
          SUM(t.subject_avg * t.coef) / NULLIF(SUM(t.coef), 0) AS student_avg
        FROM (
          SELECT
            g.student_id,
            g.subject_id,
            SUM(g.value * g.coefficient) / NULLIF(SUM(g.coefficient), 0) AS subject_avg,
            COALESCE(ls.coefficient, 1) AS coef
          FROM grades g
          JOIN enrollments e ON e.student_id = g.student_id AND e.status = 'ACTIVE'
          LEFT JOIN level_subjects ls
            ON ls.subject_id = g.subject_id
            AND ls.level_id  = ${student.level_id}
          WHERE g.term_id   = ${termId}
            AND e.class_id  = ${student.class_id}
          GROUP BY g.student_id, g.subject_id, ls.coefficient
        ) t
        GROUP BY t.student_id
      ) class_avgs
    `
    const class_average = classAvgRows[0]?.class_average ?? null

    // Classement de l'élève
    const rankRows: any[] = await db.$queryRaw`
      SELECT COUNT(*) + 1 AS rank
      FROM (
        SELECT
          t.student_id,
          SUM(t.subject_avg * t.coef) / NULLIF(SUM(t.coef), 0) AS student_avg
        FROM (
          SELECT
            g.student_id,
            g.subject_id,
            SUM(g.value * g.coefficient) / NULLIF(SUM(g.coefficient), 0) AS subject_avg,
            COALESCE(ls.coefficient, 1) AS coef
          FROM grades g
          JOIN enrollments e ON e.student_id = g.student_id AND e.status = 'ACTIVE'
          LEFT JOIN level_subjects ls
            ON ls.subject_id = g.subject_id
            AND ls.level_id  = ${student.level_id}
          WHERE g.term_id  = ${termId}
            AND e.class_id = ${student.class_id}
          GROUP BY g.student_id, g.subject_id, ls.coefficient
        ) t
        GROUP BY t.student_id
        HAVING SUM(t.subject_avg * t.coef) / NULLIF(SUM(t.coef), 0) > ${general_average ?? 0}::numeric
      ) better_students
    `
    const rank = rankRows[0]?.rank ?? null

    // Absences du trimestre
    const attendanceRows: any[] = await db.$queryRaw`
      SELECT
        COUNT(a.id)::int                                                  AS total,
        COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END)::int             AS absent,
        COUNT(CASE WHEN a.status = 'LATE'   THEN 1 END)::int             AS late,
        COUNT(CASE WHEN a.status = 'ABSENT' AND a.justified = FALSE THEN 1 END)::int AS unjustified
      FROM attendances a
      WHERE a.student_id = ${studentId}
        AND a.term_id    = ${termId}
    `
    const attendance = attendanceRows[0] ?? { total: 0, absent: 0, late: 0, unjustified: 0 }

    // Décision du conseil de classe
    const councilRows: any[] = await db.$queryRaw`
      SELECT
        cs.decision, cs.appreciation, cs.council_comment, cc.general_notes
      FROM council_students cs
      JOIN class_councils cc ON cc.id = cs.council_id
      WHERE cs.student_id = ${studentId}
        AND cc.term_id    = ${termId}
      LIMIT 1
    `
    const council = councilRows[0] ?? null

    return {
      success: true,
      data: {
        student,
        term,
        school,
        subjects,
        general_average,
        class_average,
        rank,
        attendance,
        council,
      },
    }
}

// ─── Liste des bulletins d'une classe ────────────────────────────────────────
export async function getBulletinList(
  classId?: string,
  termId?: string
): Promise<any[]> {
  const { db } = await getAnyRoleDb()

  const rows: any[] = await db.$queryRaw`
    WITH subject_avgs AS (
      SELECT
        s.id                                                          AS student_id,
        u.first_name,
        u.last_name,
        e.class_id,
        c.name                                                        AS class_name,
        g.subject_id,
        MAX(COALESCE(ls.coefficient, 1))                              AS subj_coeff,
        SUM(g.value * g.coefficient) / NULLIF(SUM(g.coefficient), 0) AS subj_avg,
        MAX(cs.decision)                                              AS decision
      FROM students s
      JOIN users u        ON u.id = s.user_id
      JOIN enrollments e  ON e.student_id = s.id AND e.status = 'ACTIVE'
      JOIN classes c      ON c.id = e.class_id
      JOIN grades g       ON g.student_id = s.id
      JOIN subjects sub   ON sub.id = g.subject_id
      LEFT JOIN level_subjects ls ON ls.subject_id = g.subject_id AND ls.level_id = c.level_id
      LEFT JOIN class_councils cc ON cc.class_id = e.class_id AND cc.term_id = g.term_id
      LEFT JOIN council_students cs ON cs.council_id = cc.id AND cs.student_id = s.id
      WHERE (${classId ?? null}::text IS NULL OR e.class_id = ${classId ?? null}::text)
        AND (${termId ?? null}::text IS NULL OR g.term_id  = ${termId ?? null}::text)
      GROUP BY s.id, u.first_name, u.last_name, e.class_id, c.name, g.subject_id
    ),
    student_avgs AS (
      SELECT
        student_id,
        first_name,
        last_name,
        class_id,
        class_name,
        SUM(subj_avg * subj_coeff) / NULLIF(SUM(subj_coeff), 0) AS average,
        MAX(decision)                                             AS decision
      FROM subject_avgs
      GROUP BY student_id, first_name, last_name, class_id, class_name
    )
    SELECT
      student_id,
      first_name,
      last_name,
      class_name,
      ROUND(average::numeric, 2)                                  AS average,
      RANK() OVER (
        PARTITION BY class_id
        ORDER BY average DESC NULLS LAST
      )                                                           AS rank,
      decision
    FROM student_avgs
    ORDER BY rank ASC, last_name, first_name
  `
  return rows
}

// ─── Trimestres et classes de l'année courante ───────────────────────────────
export async function getTermsAndClasses(): Promise<{
  terms: any[]
  classes: any[]
}> {
  const { db } = await getAnyRoleDb()

  return withRetry(async () => {
    const [terms, classes] = await Promise.all([
      db.$queryRaw`
        SELECT t.id, t.name, t.term_order, ay.id AS academic_year_id
        FROM terms t
        JOIN academic_years ay ON ay.id = t.academic_year_id AND ay.is_current = TRUE
        ORDER BY t.term_order
      ` as Promise<any[]>,
      db.$queryRaw`
        SELECT c.id, c.name, l.name AS level_name, ay.name AS academic_year_name
        FROM classes c
        JOIN levels l        ON l.id = c.level_id
        JOIN academic_years ay ON ay.id = c.academic_year_id AND ay.is_current = TRUE
        ORDER BY c.name
      ` as Promise<any[]>,
    ])
    return { terms, classes }
  })
}
