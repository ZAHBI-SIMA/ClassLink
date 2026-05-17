'use server'

import { revalidatePath } from 'next/cache'
import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import type { ActionResult } from '@/types'

async function getTeacherDb() {
  const session = await requireRole('TEACHER', 'ADMIN', 'CENSOR')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, session }
}

export async function getTeacherProfile() {
  const { db, session } = await getTeacherDb()
  const rows: any[] = await db.$queryRaw`
    SELECT t.id, t.employee_id, t.specialty,
           u.first_name, u.last_name, u.email, u.avatar_url
    FROM teachers t
    JOIN users u ON u.id = t.user_id
    WHERE t.user_id = ${session.user.id}
    LIMIT 1
  `
  return rows[0] ?? null
}

export async function getTeacherAssignments() {
  const { db, session } = await getTeacherDb()
  return db.$queryRaw`
    SELECT tsc.id, tsc.class_id, tsc.subject_id,
           c.name AS class_name,
           s.name AS subject_name, s.code AS subject_code,
           l.name AS level_name,
           ay.name AS year_name,
           COUNT(DISTINCT e.id)::int AS student_count
    FROM teacher_subject_classes tsc
    JOIN teachers t ON t.id = tsc.teacher_id
    JOIN classes c ON c.id = tsc.class_id
    JOIN subjects s ON s.id = tsc.subject_id
    JOIN levels l ON l.id = c.level_id
    JOIN academic_years ay ON ay.id = c.academic_year_id
    LEFT JOIN enrollments e ON e.class_id = c.id AND e.status = 'ACTIVE'
    WHERE t.user_id = ${session.user.id}
    AND ay.is_current = TRUE
    GROUP BY tsc.id, tsc.class_id, tsc.subject_id,
             c.name, s.name, s.code, l.name, l.level_order, ay.name
    ORDER BY l.level_order, c.name, s.name
  ` as Promise<any[]>
}

export async function getTeacherTerms() {
  const { db } = await getTeacherDb()
  return db.$queryRaw`
    SELECT t.id, t.name, t.term_order, t.start_date, t.end_date
    FROM terms t
    JOIN academic_years ay ON ay.id = t.academic_year_id
    WHERE ay.is_current = TRUE
    ORDER BY t.term_order
  ` as Promise<any[]>
}

export async function getStudentsWithGrades(
  classId: string,
  subjectId: string,
  termId: string
) {
  const { db } = await getTeacherDb()
  return db.$queryRaw`
    SELECT
      s.id              AS student_id,
      s.student_id      AS student_number,
      u.first_name,
      u.last_name,
      COALESCE(
        json_agg(
          json_build_object(
            'id',          g.id,
            'type',        g.type,
            'value',       g.value,
            'coefficient', g.coefficient,
            'comment',     g.comment
          ) ORDER BY g.created_at
        ) FILTER (WHERE g.id IS NOT NULL),
        '[]'::json
      ) AS grades,
      CASE WHEN COUNT(g.id) > 0
        THEN ROUND(SUM(g.value * g.coefficient) / NULLIF(SUM(g.coefficient), 0), 2)
        ELSE NULL
      END AS average
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
    JOIN users u ON u.id = s.user_id
    LEFT JOIN grades g
      ON g.student_id = s.id
      AND g.subject_id = ${subjectId}
      AND g.term_id    = ${termId}
    WHERE e.class_id = ${classId}
    AND e.status = 'ACTIVE'
    GROUP BY s.id, s.student_id, u.first_name, u.last_name
    ORDER BY u.last_name, u.first_name
  ` as Promise<any[]>
}

export async function saveGrade(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { db, session } = await getTeacherDb()

  const studentId  = formData.get('student_id')  as string
  const subjectId  = formData.get('subject_id')  as string
  const termId     = formData.get('term_id')     as string
  const type       = formData.get('type')        as string
  const gradeId    = formData.get('grade_id')    as string | null
  const rawValue   = formData.get('value')       as string
  const rawCoeff   = formData.get('coefficient') as string
  const comment    = (formData.get('comment') as string) || null

  const value       = parseFloat(rawValue)
  const coefficient = parseFloat(rawCoeff) || 1

  if (!studentId || !subjectId || !termId || !type) {
    return { success: false, error: 'Données manquantes.' }
  }
  if (isNaN(value) || value < 0 || value > 20) {
    return { success: false, error: 'La note doit être entre 0 et 20.' }
  }

  try {
    if (gradeId) {
      await db.$executeRaw`
        UPDATE grades
        SET value = ${value}, coefficient = ${coefficient},
            comment = ${comment}, updated_at = NOW()
        WHERE id = ${gradeId}
      `
    } else {
      await db.$executeRaw`
        INSERT INTO grades
          (student_id, subject_id, term_id, type, value, max_value, coefficient, comment, created_by)
        VALUES
          (${studentId}, ${subjectId}, ${termId}, ${type},
           ${value}, 20, ${coefficient}, ${comment}, ${session.user.id})
      `
    }
    revalidatePath('/teacher/grades')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function deleteGrade(gradeId: string): Promise<ActionResult> {
  const { db } = await getTeacherDb()
  try {
    await db.$executeRaw`DELETE FROM grades WHERE id = ${gradeId}`
    revalidatePath('/teacher/grades')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function getTeacherKPIs() {
  const { db, session } = await getTeacherDb()
  const rows: any[] = await db.$queryRaw`
    SELECT
      (SELECT COUNT(DISTINCT tsc.class_id)
       FROM teacher_subject_classes tsc
       JOIN teachers t ON t.id = tsc.teacher_id
       JOIN classes c ON c.id = tsc.class_id
       JOIN academic_years ay ON ay.id = c.academic_year_id
       WHERE t.user_id = ${session.user.id} AND ay.is_current = TRUE
      )::int AS class_count,

      (SELECT COUNT(DISTINCT tsc.subject_id)
       FROM teacher_subject_classes tsc
       JOIN teachers t ON t.id = tsc.teacher_id
       JOIN classes c ON c.id = tsc.class_id
       JOIN academic_years ay ON ay.id = c.academic_year_id
       WHERE t.user_id = ${session.user.id} AND ay.is_current = TRUE
      )::int AS subject_count,

      (SELECT COUNT(DISTINCT e.student_id)
       FROM teacher_subject_classes tsc
       JOIN teachers t ON t.id = tsc.teacher_id
       JOIN classes c ON c.id = tsc.class_id
       JOIN academic_years ay ON ay.id = c.academic_year_id
       JOIN enrollments e ON e.class_id = c.id AND e.status = 'ACTIVE'
       WHERE t.user_id = ${session.user.id} AND ay.is_current = TRUE
      )::int AS student_count,

      (SELECT COUNT(*)
       FROM grades g
       JOIN teachers t ON t.user_id = ${session.user.id}
       JOIN teacher_subject_classes tsc ON tsc.teacher_id = t.id
         AND tsc.subject_id = g.subject_id
       WHERE g.created_at > NOW() - INTERVAL '30 days'
      )::int AS grades_entered_30d
  `
  return rows[0] ?? { class_count: 0, subject_count: 0, student_count: 0, grades_entered_30d: 0 }
}

// ─── Présences ────────────────────────────────────────────────────────────────

export async function getTeacherClasses() {
  const { db, session } = await getTeacherDb()
  return db.$queryRaw`
    SELECT DISTINCT c.id, c.name, l.name AS level_name, l.level_order
    FROM teacher_subject_classes tsc
    JOIN teachers t ON t.id = tsc.teacher_id
    JOIN classes c ON c.id = tsc.class_id
    JOIN levels l ON l.id = c.level_id
    JOIN academic_years ay ON ay.id = c.academic_year_id
    WHERE t.user_id = ${session.user.id} AND ay.is_current = TRUE
    ORDER BY l.level_order, c.name
  ` as Promise<any[]>
}

export async function getClassAttendance(classId: string, date: string) {
  const { db } = await getTeacherDb()
  return db.$queryRaw`
    SELECT
      s.id              AS student_id,
      s.student_id      AS student_number,
      u.first_name, u.last_name,
      a.id              AS attendance_id,
      COALESCE(a.status, 'PRESENT') AS status,
      COALESCE(a.justified, FALSE)  AS justified,
      a.justification
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
    JOIN users u ON u.id = s.user_id
    LEFT JOIN attendances a
      ON a.student_id = s.id
      AND a.date = ${date}::date
      AND a.schedule_id IS NULL
    WHERE e.class_id = ${classId} AND e.status = 'ACTIVE'
    ORDER BY u.last_name, u.first_name
  ` as Promise<any[]>
}

export async function saveAttendance(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { db, session } = await getTeacherDb()

  const classId = formData.get('class_id') as string
  const date    = formData.get('date')     as string
  if (!classId || !date) return { success: false, error: 'Classe et date requis.' }

  const terms: any[] = await db.$queryRaw`
    SELECT t.id FROM terms t
    JOIN academic_years ay ON ay.id = t.academic_year_id
    WHERE ay.is_current = TRUE
      AND ${date}::date BETWEEN t.start_date AND t.end_date
    LIMIT 1
  `
  if (!terms[0]) return { success: false, error: 'Aucun trimestre actif pour cette date.' }
  const termId = terms[0].id

  const studentIds = formData.getAll('student_id') as string[]
  try {
    for (const sid of studentIds) {
      const status      = (formData.get(`status_${sid}`)      as string) || 'PRESENT'
      const justified   = formData.get(`justified_${sid}`)    === '1'
      const justification = (formData.get(`justification_${sid}`) as string) || null

      await db.$executeRaw`
        DELETE FROM attendances
        WHERE student_id = ${sid} AND date = ${date}::date AND schedule_id IS NULL
      `
      await db.$executeRaw`
        INSERT INTO attendances
          (student_id, term_id, date, status, justified, justification, recorded_by)
        VALUES
          (${sid}, ${termId}, ${date}::date, ${status}, ${justified}, ${justification}, ${session.user.id})
      `
    }
    revalidatePath('/teacher/attendance')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
