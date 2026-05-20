'use server'

import { revalidatePath } from 'next/cache'
import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import type { ActionResult } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

async function getTeacherDb() {
  const session = await requireRole('TEACHER', 'ADMIN', 'CENSOR')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, session }
}

async function getStudentDb() {
  const session = await requireRole('STUDENT')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, session }
}

// ─── Enseignant : Devoirs ─────────────────────────────────────────────────────

/**
 * Tous les devoirs créés par l'enseignant connecté.
 * JOIN classes, subjects, COUNT submissions. ORDER BY due_date DESC.
 */
export async function getTeacherAssignmentList(): Promise<any[]> {
  const { db, session } = await getTeacherDb()
  return db.$queryRaw`
    SELECT
      a.id,
      a.title,
      a.description,
      a.due_date,
      a.max_score,
      a.created_at,
      c.id   AS class_id,
      c.name AS class_name,
      s.id   AS subject_id,
      s.name AS subject_name,
      s.code AS subject_code,
      COUNT(DISTINCT sub.id)::int AS submission_count,
      (
        SELECT COUNT(DISTINCT e.student_id)
        FROM enrollments e
        WHERE e.class_id = a.class_id AND e.status = 'ACTIVE'
      )::int AS total_students
    FROM assignments a
    JOIN classes  c ON c.id = a.class_id
    JOIN subjects s ON s.id = a.subject_id
    JOIN teachers t ON t.user_id = ${session.user.id}
    LEFT JOIN submissions sub ON sub.assignment_id = a.id
    WHERE a.teacher_id = t.id::text
    GROUP BY a.id, c.id, c.name, s.id, s.name, s.code
    ORDER BY a.due_date DESC
  ` as Promise<any[]>
}

/**
 * Crée un devoir après vérification que l'enseignant est bien assigné à cette
 * combinaison classe + matière.
 */
export async function createAssignment(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { db, session } = await getTeacherDb()

  const classId     = formData.get('class_id')   as string
  const subjectId   = formData.get('subject_id') as string
  const title       = formData.get('title')      as string
  const description = (formData.get('description') as string) || null
  const dueDateRaw  = formData.get('due_date')   as string
  const maxScoreRaw = formData.get('max_score')  as string

  if (!classId || !subjectId || !title || !dueDateRaw) {
    return { success: false, error: 'Classe, matière, titre et date limite sont requis.' }
  }

  const dueDate  = toDate(dueDateRaw)
  if (!dueDate) return { success: false, error: 'Date limite invalide.' }

  const maxScore = maxScoreRaw ? parseFloat(maxScoreRaw) : 20
  if (isNaN(maxScore) || maxScore <= 0) {
    return { success: false, error: 'La note maximale doit être un nombre positif.' }
  }

  try {
    // Vérifier que l'enseignant est assigné à cette classe + matière
    const check: any[] = await db.$queryRaw`
      SELECT tsc.id FROM teacher_subject_classes tsc
      JOIN teachers t ON t.id = tsc.teacher_id
      WHERE t.user_id   = ${session.user.id}
        AND tsc.class_id   = ${classId}
        AND tsc.subject_id = ${subjectId}
      LIMIT 1
    `
    if (check.length === 0) {
      return {
        success: false,
        error: 'Vous n\'êtes pas autorisé à créer un devoir pour cette classe et matière.',
      }
    }

    const teacherRows: any[] = await db.$queryRaw`
      SELECT id FROM teachers WHERE user_id = ${session.user.id} LIMIT 1
    `
    if (!teacherRows[0]) return { success: false, error: 'Profil enseignant introuvable.' }
    const teacherId = teacherRows[0].id as string

    await db.$executeRaw`
      INSERT INTO assignments (class_id, teacher_id, subject_id, title, description, due_date, max_score)
      VALUES (${classId}, ${teacherId}::text, ${subjectId}, ${title}, ${description}, ${dueDate}, ${maxScore})
    `
    revalidatePath('/teacher/assignments')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

/**
 * Toutes les soumissions pour un devoir donné, incluant les élèves sans soumission.
 */
export async function getAssignmentSubmissions(assignmentId: string): Promise<{
  assignment: any
  submissions: any[]
}> {
  const { db, session } = await getTeacherDb()

  const assignments: any[] = await db.$queryRaw`
    SELECT a.id, a.title, a.max_score, a.due_date, a.class_id,
           c.name AS class_name, s.name AS subject_name
    FROM assignments a
    JOIN classes  c ON c.id = a.class_id
    JOIN subjects s ON s.id = a.subject_id
    JOIN teachers t ON t.user_id = ${session.user.id}
    WHERE a.id = ${assignmentId}
      AND a.teacher_id = t.id::text
    LIMIT 1
  `
  const assignment = assignments[0] ?? null

  if (!assignment) return { assignment: null, submissions: [] }

  const submissions: any[] = await db.$queryRaw`
    SELECT
      st.id           AS student_id,
      u.first_name,
      u.last_name,
      sub.id          AS submission_id,
      sub.files,
      sub.submitted_at,
      sub.score,
      sub.feedback,
      sub.graded_at,
      sub.status
    FROM enrollments e
    JOIN students st ON st.id = e.student_id
    JOIN users    u  ON u.id  = st.user_id
    LEFT JOIN submissions sub
      ON sub.assignment_id = ${assignmentId}
      AND sub.student_id   = st.id::text
    WHERE e.class_id = ${assignment.class_id}
      AND e.status   = 'ACTIVE'
    ORDER BY u.last_name, u.first_name
  `

  return { assignment, submissions }
}

/**
 * Note une soumission (score + feedback).
 */
export async function gradeSubmission(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { db, session } = await getTeacherDb()

  const submissionId  = formData.get('submission_id') as string
  const scoreRaw      = formData.get('score')         as string
  const feedback      = (formData.get('feedback') as string) || null
  const assignmentId  = formData.get('assignment_id') as string

  if (!submissionId) return { success: false, error: 'Soumission introuvable.' }

  const score = parseFloat(scoreRaw)
  if (isNaN(score) || score < 0) {
    return { success: false, error: 'La note doit être un nombre positif.' }
  }

  try {
    // Verify the submission belongs to an assignment owned by the calling teacher
    await db.$executeRaw`
      UPDATE submissions sub
      SET score      = ${score},
          feedback   = ${feedback},
          graded_at  = NOW(),
          status     = 'GRADED'
      FROM assignments a
      JOIN teachers t ON t.id::text = a.teacher_id
      WHERE sub.id            = ${submissionId}
        AND sub.assignment_id = a.id
        AND (t.user_id = ${session.user.id} OR ${session.user.role !== 'TEACHER'})
    `
    revalidatePath('/teacher/assignments')
    if (assignmentId) {
      revalidatePath(`/teacher/assignments?tab=grade&assignmentId=${assignmentId}`)
    }
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

/**
 * Supprime un devoir si l'enseignant connecté en est l'auteur.
 */
export async function deleteAssignment(id: string): Promise<ActionResult> {
  const { db, session } = await getTeacherDb()
  try {
    const teacherRows: any[] = await db.$queryRaw`
      SELECT id FROM teachers WHERE user_id = ${session.user.id} LIMIT 1
    `
    if (!teacherRows[0]) return { success: false, error: 'Profil enseignant introuvable.' }
    const teacherId = teacherRows[0].id as string

    await db.$executeRaw`
      DELETE FROM assignments
      WHERE id = ${id} AND teacher_id = ${teacherId}::text
    `
    revalidatePath('/teacher/assignments')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ─── Élève : Devoirs ──────────────────────────────────────────────────────────

/**
 * Tous les devoirs de la classe de l'élève connecté, avec sa soumission si elle existe.
 */
export async function getStudentAssignments(): Promise<any[]> {
  const { db, session } = await getStudentDb()

  return db.$queryRaw`
    SELECT
      a.id,
      a.title,
      a.description,
      a.due_date,
      a.max_score,
      s.name AS subject_name,
      s.code AS subject_code,
      u.first_name AS teacher_first,
      u.last_name  AS teacher_last,
      sub.id          AS submission_id,
      sub.files,
      sub.submitted_at,
      sub.score,
      sub.feedback,
      sub.graded_at,
      sub.status      AS submission_status
    FROM assignments a
    JOIN subjects  s  ON s.id = a.subject_id
    JOIN teachers  t  ON t.id::text = a.teacher_id
    JOIN users     u  ON u.id = t.user_id
    LEFT JOIN submissions sub
      ON sub.assignment_id = a.id
      AND sub.student_id = (
        SELECT st.id::text FROM students st WHERE st.user_id = ${session.user.id} LIMIT 1
      )
    WHERE a.class_id = (
      SELECT e.class_id FROM enrollments e
      JOIN students st ON st.id = e.student_id
      WHERE st.user_id = ${session.user.id} AND e.status = 'ACTIVE'
      LIMIT 1
    )
    ORDER BY a.due_date ASC
  ` as Promise<any[]>
}

/**
 * Soumet ou met à jour la soumission d'un devoir pour l'élève connecté.
 */
export async function submitAssignment(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { db, session } = await getStudentDb()

  const assignmentId = formData.get('assignment_id') as string
  const content      = (formData.get('content') as string) || ''

  if (!assignmentId) return { success: false, error: 'Devoir introuvable.' }
  if (!content.trim()) return { success: false, error: 'Le contenu du rendu ne peut pas être vide.' }

  try {
    const studentRows: any[] = await db.$queryRaw`
      SELECT id FROM students WHERE user_id = ${session.user.id} LIMIT 1
    `
    if (!studentRows[0]) return { success: false, error: 'Profil élève introuvable.' }
    const studentId = studentRows[0].id as string

    // Récupérer la date limite du devoir
    const asgRows: any[] = await db.$queryRaw`
      SELECT due_date FROM assignments WHERE id = ${assignmentId} LIMIT 1
    `
    if (!asgRows[0]) return { success: false, error: 'Devoir introuvable.' }

    const dueDate = new Date(asgRows[0].due_date)
    const status  = new Date() <= dueDate ? 'SUBMITTED' : 'LATE'

    const filesJson = JSON.stringify({ text: content })

    // Vérifier si une soumission existe déjà
    const existing: any[] = await db.$queryRaw`
      SELECT id FROM submissions
      WHERE assignment_id = ${assignmentId} AND student_id = ${studentId}::text
      LIMIT 1
    `

    if (existing[0]) {
      await db.$executeRaw`
        UPDATE submissions
        SET files        = ${filesJson}::jsonb,
            submitted_at = NOW(),
            status       = ${status}
        WHERE id = ${existing[0].id}
      `
    } else {
      await db.$executeRaw`
        INSERT INTO submissions (assignment_id, student_id, files, submitted_at, status)
        VALUES (${assignmentId}, ${studentId}::text, ${filesJson}::jsonb, NOW(), ${status})
      `
    }

    revalidatePath('/student/assignments')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ─── Enseignant : Cahier de texte ─────────────────────────────────────────────

/**
 * Leçons de l'enseignant connecté, avec filtres optionnels classe / matière.
 */
export async function getTeacherLessons(
  classId?: string,
  subjectId?: string
): Promise<any[]> {
  const { db, session } = await getTeacherDb()

  const classFilter   = classId   ? classId   : null
  const subjectFilter = subjectId ? subjectId : null

  return db.$queryRaw`
    SELECT
      l.id,
      l.date,
      l.title,
      l.content,
      l.next_content,
      l.homework,
      l.created_at,
      l.schedule_id,
      s.id   AS subject_id,
      s.name AS subject_name,
      s.code AS subject_code,
      c.id   AS class_id,
      c.name AS class_name
    FROM lessons l
    JOIN subjects s ON s.id = l.subject_id
    JOIN teachers t ON t.user_id = ${session.user.id}
    LEFT JOIN schedules sc ON sc.id = l.schedule_id
    LEFT JOIN teacher_subject_classes tsc ON tsc.id = sc.teacher_subject_class_id
    LEFT JOIN classes c ON c.id = COALESCE(sc.class_id, tsc.class_id)
    WHERE l.teacher_id = t.id::text
      AND (${classFilter}::text IS NULL   OR c.id = ${classFilter})
      AND (${subjectFilter}::text IS NULL OR s.id = ${subjectFilter})
    ORDER BY l.date DESC
    LIMIT 30
  ` as Promise<any[]>
}

/**
 * Crée une entrée dans le cahier de texte.
 */
export async function createLesson(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { db, session } = await getTeacherDb()

  const scheduleId  = (formData.get('schedule_id') as string) || null
  const subjectId   = formData.get('subject_id')   as string
  const dateRaw     = formData.get('date')         as string
  const title       = formData.get('title')        as string
  const content     = (formData.get('content')      as string) || null
  const nextContent = (formData.get('next_content') as string) || null
  const homework    = (formData.get('homework')     as string) || null

  if (!subjectId || !dateRaw || !title) {
    return { success: false, error: 'Matière, date et titre sont requis.' }
  }

  const date = toDate(dateRaw)
  if (!date) return { success: false, error: 'Date invalide.' }

  try {
    const teacherRows: any[] = await db.$queryRaw`
      SELECT id FROM teachers WHERE user_id = ${session.user.id} LIMIT 1
    `
    if (!teacherRows[0]) return { success: false, error: 'Profil enseignant introuvable.' }
    const teacherId = teacherRows[0].id as string

    await db.$executeRaw`
      INSERT INTO lessons (schedule_id, subject_id, date, title, content, next_content, homework, teacher_id)
      VALUES (${scheduleId}, ${subjectId}, ${date}, ${title}, ${content}, ${nextContent}, ${homework}, ${teacherId}::text)
    `
    revalidatePath('/teacher/lessons')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

/**
 * Supprime une leçon si l'enseignant connecté en est l'auteur.
 */
export async function deleteLesson(id: string): Promise<ActionResult> {
  const { db, session } = await getTeacherDb()
  try {
    const teacherRows: any[] = await db.$queryRaw`
      SELECT id FROM teachers WHERE user_id = ${session.user.id} LIMIT 1
    `
    if (!teacherRows[0]) return { success: false, error: 'Profil enseignant introuvable.' }
    const teacherId = teacherRows[0].id as string

    await db.$executeRaw`
      DELETE FROM lessons WHERE id = ${id} AND teacher_id = ${teacherId}::text
    `
    revalidatePath('/teacher/lessons')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

/**
 * Retourne la liste des (class_id, class_name, subject_id, subject_name, tsc_id)
 * pour l'enseignant connecté. Utilisé pour les filtres et les formulaires.
 */
export async function getTeacherSubjectsAndClasses(): Promise<any[]> {
  const { db, session } = await getTeacherDb()
  return db.$queryRaw`
    SELECT
      tsc.id         AS tsc_id,
      tsc.class_id,
      tsc.subject_id,
      c.name         AS class_name,
      s.name         AS subject_name,
      s.code         AS subject_code
    FROM teacher_subject_classes tsc
    JOIN teachers t ON t.id = tsc.teacher_id
    JOIN classes  c ON c.id = tsc.class_id
    JOIN subjects s ON s.id = tsc.subject_id
    JOIN academic_years ay ON ay.id = c.academic_year_id
    WHERE t.user_id = ${session.user.id}
      AND ay.is_current = TRUE
    ORDER BY c.name, s.name
  ` as Promise<any[]>
}

/**
 * Retourne les créneaux horaires associés à l'enseignant connecté.
 * Utilisé pour le champ optionnel schedule_id dans CreateLessonForm.
 */
export async function getTeacherScheduleList(): Promise<any[]> {
  const { db, session } = await getTeacherDb()
  return db.$queryRaw`
    SELECT
      sc.id,
      sc.day_of_week,
      sc.start_time,
      sc.end_time,
      c.name  AS class_name,
      s.name  AS subject_name,
      s.code  AS subject_code,
      tsc.class_id,
      tsc.subject_id
    FROM schedules sc
    JOIN teacher_subject_classes tsc ON tsc.id = sc.teacher_subject_class_id
    JOIN teachers t ON t.id = tsc.teacher_id
    JOIN classes  c ON c.id = tsc.class_id
    JOIN subjects s ON s.id = tsc.subject_id
    JOIN academic_years ay ON ay.id = c.academic_year_id
    WHERE t.user_id = ${session.user.id}
      AND ay.is_current = TRUE
    ORDER BY sc.day_of_week, sc.start_time
  ` as Promise<any[]>
}
