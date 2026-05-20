'use server'

import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import { revalidatePath } from 'next/cache'
import { toActionError } from '@/lib/errors'
import type { ActionResult } from '@/types'

async function getStudentDb() {
  const session = await requireRole('STUDENT')
  const db = getTenantPrisma(session.user.schemaName) as any
  const students: any[] = await db.$queryRaw`
    SELECT id FROM students WHERE user_id = ${session.user.id} LIMIT 1
  `
  const student = students[0]
  if (!student) throw new Error('Profil élève introuvable.')
  return { db, session, studentId: student.id as string }
}

export async function getMyQuizzes(): Promise<any[]> {
  const { db, studentId } = await getStudentDb()
  return db.$queryRaw`
    SELECT q.id, q.title, q.description, q.time_limit, q.max_attempts,
           q.due_date, s.name AS subject_name,
           qa.id AS attempt_id, qa.status AS attempt_status,
           qa.score, qa.max_score, qa.submitted_at
    FROM quizzes q
    LEFT JOIN subjects s ON s.id = q.subject_id
    JOIN enrollments e ON e.class_id = q.class_id AND e.student_id = ${studentId} AND e.status = 'ACTIVE'
    LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.student_id = ${studentId}
    WHERE q.is_published = TRUE
    ORDER BY q.due_date ASC NULLS LAST, q.created_at DESC
  ` as Promise<any[]>
}

export async function getQuizWithQuestions(quizId: string): Promise<ActionResult<any>> {
  try {
    const { db, studentId } = await getStudentDb()
    const quizRows: any[] = await db.$queryRaw`
      SELECT q.id, q.title, q.description, q.time_limit, q.max_attempts
      FROM quizzes q WHERE q.id = ${quizId} AND q.is_published = TRUE LIMIT 1
    `
    if (!quizRows[0]) return { success: false, error: 'Quiz introuvable.' }

    const questions: any[] = await db.$queryRaw`
      SELECT id, question, type, options, points, order_num
      FROM quiz_questions WHERE quiz_id = ${quizId} ORDER BY order_num
    `
    const attempts: any[] = await db.$queryRaw`
      SELECT id, status, score, max_score, submitted_at
      FROM quiz_attempts
      WHERE quiz_id = ${quizId} AND student_id = ${studentId}
      ORDER BY started_at DESC
    `
    return { success: true, data: { quiz: quizRows[0], questions, attempts } }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function startQuizAttempt(quizId: string): Promise<ActionResult<{ attemptId: string }>> {
  try {
    const { db, studentId } = await getStudentDb()
    // Check for existing in-progress attempt
    const existing: any[] = await db.$queryRaw`
      SELECT id FROM quiz_attempts
      WHERE quiz_id = ${quizId} AND student_id = ${studentId} AND status = 'IN_PROGRESS'
      LIMIT 1
    `
    if (existing[0]) return { success: true, data: { attemptId: existing[0].id } }

    // Check max_attempts
    const quizRows: any[] = await db.$queryRaw`
      SELECT max_attempts FROM quizzes WHERE id = ${quizId} LIMIT 1
    `
    const maxAttempts = quizRows[0]?.max_attempts ?? 1
    const attemptCount: any[] = await db.$queryRaw`
      SELECT COUNT(*)::int AS cnt FROM quiz_attempts
      WHERE quiz_id = ${quizId} AND student_id = ${studentId} AND status = 'SUBMITTED'
    `
    if ((attemptCount[0]?.cnt ?? 0) >= maxAttempts) {
      return { success: false, error: 'Nombre maximum de tentatives atteint.' }
    }

    const rows: any[] = await db.$queryRaw`
      INSERT INTO quiz_attempts (quiz_id, student_id, status, answers)
      VALUES (${quizId}, ${studentId}, 'IN_PROGRESS', '{}'::jsonb)
      RETURNING id
    `
    revalidatePath('/student/quiz')
    return { success: true, data: { attemptId: rows[0].id } }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function submitQuizAttempt(
  attemptId: string,
  answers: Record<string, string>
): Promise<ActionResult<{ score: number; maxScore: number }>> {
  try {
    const { db, studentId } = await getStudentDb()

    const attemptRows: any[] = await db.$queryRaw`
      SELECT qa.id, qa.quiz_id FROM quiz_attempts qa
      WHERE qa.id = ${attemptId} AND qa.student_id = ${studentId} AND qa.status = 'IN_PROGRESS'
      LIMIT 1
    `
    if (!attemptRows[0]) return { success: false, error: 'Tentative introuvable.' }
    const quizId = attemptRows[0].quiz_id

    const questions: any[] = await db.$queryRaw`
      SELECT id, correct, points FROM quiz_questions WHERE quiz_id = ${quizId}
    `
    let score = 0
    let maxScore = 0
    for (const q of questions) {
      const pts = parseFloat(q.points ?? '1')
      maxScore += pts
      if (answers[q.id]?.trim().toLowerCase() === String(q.correct).trim().toLowerCase()) {
        score += pts
      }
    }

    const answersJson = JSON.stringify(answers)
    await db.$executeRaw`
      UPDATE quiz_attempts
      SET answers = ${answersJson}::jsonb, score = ${score}, max_score = ${maxScore},
          submitted_at = NOW(), status = 'SUBMITTED'
      WHERE id = ${attemptId}
    `

    // Award XP
    const xpPoints = maxScore > 0 ? Math.round((score / maxScore) * 50) + 10 : 10
    await db.$executeRaw`
      INSERT INTO student_xp (student_id, source, points) VALUES (${studentId}, 'QUIZ_COMPLETED', ${xpPoints})
    `

    // First quiz badge
    const attemptCount: any[] = await db.$queryRaw`
      SELECT COUNT(*)::int AS cnt FROM quiz_attempts
      WHERE student_id = ${studentId} AND status = 'SUBMITTED'
    `
    if ((attemptCount[0]?.cnt ?? 0) === 1) {
      await db.$executeRaw`
        INSERT INTO student_badges (student_id, badge_type, details)
        VALUES (${studentId}, 'FIRST_QUIZ', 'Premier quiz complété')
        ON CONFLICT (student_id, badge_type) DO NOTHING
      `
    }

    // Perfect score badge
    if (maxScore > 0 && score === maxScore) {
      await db.$executeRaw`
        INSERT INTO student_badges (student_id, badge_type, details)
        VALUES (${studentId}, 'PERFECT_SCORE', 'Score parfait à un quiz')
        ON CONFLICT (student_id, badge_type) DO NOTHING
      `
    }

    revalidatePath('/student/quiz')
    return { success: true, data: { score, maxScore } }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}
