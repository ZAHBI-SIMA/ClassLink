'use server'

import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import { revalidatePath } from 'next/cache'
import { toActionError } from '@/lib/errors'
import type { ActionResult } from '@/types'

const VALID_QUESTION_TYPES = ['MCQ', 'TRUE_FALSE', 'SHORT'] as const

async function getTeacherDb() {
  const session = await requireRole('TEACHER', 'ADMIN', 'CENSOR')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, userId: session.user.id, role: session.user.role }
}

export async function getMyCreatedQuizzes(): Promise<any[]> {
  const { db, userId } = await getTeacherDb()
  return db.$queryRaw`
    SELECT q.id, q.title, q.description, q.is_published, q.due_date, q.max_attempts,
           s.name AS subject_name, c.name AS class_name,
           COUNT(qa.id)::int AS attempt_count,
           COUNT(qq.id)::int AS question_count
    FROM quizzes q
    LEFT JOIN subjects s ON s.id = q.subject_id
    LEFT JOIN classes c ON c.id = q.class_id
    LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
    LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
    WHERE q.created_by = ${userId}
    GROUP BY q.id, q.title, q.description, q.is_published, q.due_date,
             q.max_attempts, s.name, c.name
    ORDER BY q.created_at DESC
  ` as Promise<any[]>
}

export async function createQuiz(
  title: string,
  description: string,
  subjectId: string,
  classId: string,
  timeLimitMin: number | null,
  maxAttempts: number,
  dueDate: string | null
): Promise<ActionResult<{ id: string }>> {
  try {
    const { db, userId } = await getTeacherDb()
    const rows: any[] = await db.$queryRaw`
      INSERT INTO quizzes (title, description, subject_id, class_id, time_limit,
                           max_attempts, due_date, created_by)
      VALUES (${title}, ${description || null}, ${subjectId || null}, ${classId || null},
              ${timeLimitMin}, ${maxAttempts}, ${dueDate ? new Date(dueDate) : null}, ${userId})
      RETURNING id
    `
    revalidatePath('/teacher/quiz')
    return { success: true, data: { id: rows[0].id } }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function toggleQuizPublish(id: string): Promise<ActionResult> {
  try {
    const { db, userId, role } = await getTeacherDb()
    // TEACHER: only their own quiz. ADMIN/CENSOR: any quiz in the tenant.
    if (role === 'TEACHER') {
      await db.$executeRaw`
        UPDATE quizzes SET is_published = NOT is_published
        WHERE id = ${id} AND created_by = ${userId}
      `
    } else {
      await db.$executeRaw`
        UPDATE quizzes SET is_published = NOT is_published WHERE id = ${id}
      `
    }
    revalidatePath('/teacher/quiz')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function addQuestion(
  quizId: string,
  question: string,
  type: string,
  options: string[],
  correct: string,
  points: number
): Promise<ActionResult<{ id: string }>> {
  try {
    const { db, userId, role } = await getTeacherDb()
    // Validate enum
    if (!VALID_QUESTION_TYPES.includes(type as any)) {
      return { success: false, error: 'Type de question invalide.' }
    }
    // Verify quiz ownership for TEACHER role
    if (role === 'TEACHER') {
      const owned: any[] = await db.$queryRaw`
        SELECT id FROM quizzes WHERE id = ${quizId} AND created_by = ${userId} LIMIT 1
      `
      if (!owned[0]) return { success: false, error: 'Quiz introuvable ou accès refusé.' }
    }
    // Get current max order
    const orderRows: any[] = await db.$queryRaw`
      SELECT COALESCE(MAX(order_num), -1)::int AS max_order FROM quiz_questions WHERE quiz_id = ${quizId}
    `
    const nextOrder = (orderRows[0]?.max_order ?? -1) + 1
    const optionsJson = JSON.stringify(options)
    const rows: any[] = await db.$queryRaw`
      INSERT INTO quiz_questions (quiz_id, question, type, options, correct, points, order_num)
      VALUES (${quizId}, ${question}, ${type}, ${optionsJson}::jsonb, ${correct}, ${points}, ${nextOrder})
      RETURNING id
    `
    revalidatePath('/teacher/quiz')
    return { success: true, data: { id: rows[0].id } }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function deleteQuestion(id: string): Promise<ActionResult> {
  try {
    const { db, userId, role } = await getTeacherDb()
    // TEACHER: only questions belonging to their own quiz
    if (role === 'TEACHER') {
      await db.$executeRaw`
        DELETE FROM quiz_questions
        WHERE id = ${id}
          AND quiz_id IN (SELECT id FROM quizzes WHERE created_by = ${userId})
      `
    } else {
      await db.$executeRaw`DELETE FROM quiz_questions WHERE id = ${id}`
    }
    revalidatePath('/teacher/quiz')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

// ─── FormData wrappers for form actions ──────────────────────────────────────
export async function createQuizForm(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const subjectId = formData.get('subjectId') as string
  const classId = formData.get('classId') as string
  const timeLimitStr = formData.get('timeLimitMin') as string
  const maxAttempts = parseInt(formData.get('maxAttempts') as string) || 1
  const dueDate = formData.get('dueDate') as string
  const timeLimit = timeLimitStr ? parseInt(timeLimitStr) : null
  return createQuiz(title, description, subjectId, classId, timeLimit, maxAttempts, dueDate || null)
}

export async function addQuestionForm(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const quizId = formData.get('quizId') as string
  const question = formData.get('question') as string
  const type = formData.get('type') as string
  const optionsStr = formData.get('options') as string
  const correct = formData.get('correct') as string
  const points = parseFloat(formData.get('points') as string) || 1
  const options = optionsStr ? optionsStr.split('|').map(o => o.trim()).filter(Boolean) : []
  return addQuestion(quizId, question, type, options, correct, points)
}

export async function getQuizForEdit(quizId: string): Promise<ActionResult<any>> {
  try {
    const { db, userId, role } = await getTeacherDb()
    const quizRows: any[] = await db.$queryRaw`
      SELECT q.id, q.title, q.description, q.is_published, q.time_limit, q.max_attempts, q.due_date,
             s.name AS subject_name, c.name AS class_name
      FROM quizzes q
      LEFT JOIN subjects s ON s.id = q.subject_id
      LEFT JOIN classes c ON c.id = q.class_id
      WHERE q.id = ${quizId}
        AND (q.created_by = ${userId} OR ${role !== 'TEACHER'})
      LIMIT 1
    `
    const questions: any[] = await db.$queryRaw`
      SELECT id, question, type, options, correct, points, order_num
      FROM quiz_questions WHERE quiz_id = ${quizId} ORDER BY order_num
    `
    return { success: true, data: { quiz: quizRows[0], questions } }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}
