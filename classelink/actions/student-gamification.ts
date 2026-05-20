'use server'

import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import { revalidatePath } from 'next/cache'
import { toActionError } from '@/lib/errors'
import { rateLimit } from '@/lib/rate-limit'
import type { ActionResult } from '@/types'

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const
const VALID_GOAL_STATUSES = ['ACTIVE', 'ACHIEVED', 'ABANDONED'] as const

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

export async function getMyBadges(): Promise<any[]> {
  const { db, studentId } = await getStudentDb()
  return db.$queryRaw`
    SELECT badge_type, earned_at, details
    FROM student_badges WHERE student_id = ${studentId} ORDER BY earned_at DESC
  ` as Promise<any[]>
}

export async function getMyXP(): Promise<{ total: number; level: number; nextLevelXP: number }> {
  const { db, studentId } = await getStudentDb()
  const rows: any[] = await db.$queryRaw`
    SELECT COALESCE(SUM(points), 0)::int AS total FROM student_xp WHERE student_id = ${studentId}
  `
  const total: number = rows[0]?.total ?? 0
  const level = Math.floor(total / 100) + 1
  const nextLevelXP = level * 100 - total
  return { total, level, nextLevelXP }
}

export async function getMyTodos(): Promise<any[]> {
  const { db, studentId } = await getStudentDb()
  return db.$queryRaw`
    SELECT id, title, description, due_date, priority, completed, completed_at, created_at
    FROM student_todos WHERE student_id = ${studentId}
    ORDER BY completed ASC, priority DESC, due_date ASC NULLS LAST
  ` as Promise<any[]>
}

export async function createTodo(
  title: string,
  description: string,
  dueDate: string,
  priority: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const { db, studentId } = await getStudentDb()
    // Validation
    if (!title || title.trim().length === 0) return { success: false, error: 'Titre requis.' }
    if (title.length > 500) return { success: false, error: 'Titre trop long (max 500 caractères).' }
    const safePriority = VALID_PRIORITIES.includes(priority as any) ? priority : 'MEDIUM'
    const dueDateVal = dueDate ? new Date(dueDate) : null
    const rows: any[] = await db.$queryRaw`
      INSERT INTO student_todos (student_id, title, description, due_date, priority)
      VALUES (${studentId}, ${title.trim()}, ${description?.trim() || null}, ${dueDateVal}, ${safePriority})
      RETURNING id
    `
    revalidatePath('/student/todo')
    return { success: true, data: { id: rows[0].id } }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function toggleTodo(id: string): Promise<ActionResult> {
  try {
    const { db, studentId } = await getStudentDb()
    const rows: any[] = await db.$queryRaw`
      SELECT completed FROM student_todos WHERE id = ${id} AND student_id = ${studentId} LIMIT 1
    `
    if (!rows[0]) return { success: false, error: 'Tâche introuvable.' }
    const nowCompleted = !rows[0].completed
    await db.$executeRaw`
      UPDATE student_todos
      SET completed = ${nowCompleted}, completed_at = ${nowCompleted ? new Date() : null}
      WHERE id = ${id} AND student_id = ${studentId}
    `
    if (nowCompleted) {
      // Anti-spam: max 20 XP from todos per student per day (2 completions/day)
      const xpAllowed = await rateLimit(`xp_todo:${studentId}`, 2, 24 * 60 * 60 * 1000)
      if (xpAllowed) {
        await db.$executeRaw`
          INSERT INTO student_xp (student_id, source, points)
          VALUES (${studentId}, 'TODO_COMPLETED', 10)
        `
      }
    }
    revalidatePath('/student/todo')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function deleteTodo(id: string): Promise<ActionResult> {
  try {
    const { db, studentId } = await getStudentDb()
    await db.$executeRaw`DELETE FROM student_todos WHERE id = ${id} AND student_id = ${studentId}`
    revalidatePath('/student/todo')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function getMyGoals(): Promise<any[]> {
  const { db, studentId } = await getStudentDb()
  return db.$queryRaw`
    SELECT sg.id, sg.title, sg.target_value, sg.current_value, sg.unit,
           sg.deadline, sg.status, sg.created_at, s.name AS subject_name
    FROM student_goals sg LEFT JOIN subjects s ON s.id = sg.subject_id
    WHERE sg.student_id = ${studentId}
    ORDER BY sg.status, sg.deadline ASC NULLS LAST
  ` as Promise<any[]>
}

export async function createGoal(
  title: string,
  subjectId: string,
  targetValue: number,
  unit: string,
  deadline: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const { db, studentId } = await getStudentDb()
    const deadlineVal = deadline ? new Date(deadline) : null
    const rows: any[] = await db.$queryRaw`
      INSERT INTO student_goals (student_id, subject_id, title, target_value, unit, deadline)
      VALUES (${studentId}, ${subjectId || null}, ${title}, ${targetValue}, ${unit}, ${deadlineVal})
      RETURNING id
    `
    revalidatePath('/student/goals')
    return { success: true, data: { id: rows[0].id } }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function updateGoalProgress(id: string, currentValue: number): Promise<ActionResult> {
  try {
    const { db, studentId } = await getStudentDb()
    const rows: any[] = await db.$queryRaw`
      SELECT target_value, status FROM student_goals WHERE id = ${id} AND student_id = ${studentId} LIMIT 1
    `
    if (!rows[0]) return { success: false, error: 'Objectif introuvable.' }
    const achieved = currentValue >= parseFloat(rows[0].target_value)
    const status = achieved ? 'ACHIEVED' : rows[0].status
    await db.$executeRaw`
      UPDATE student_goals SET current_value = ${currentValue}, status = ${status}
      WHERE id = ${id} AND student_id = ${studentId}
    `
    if (achieved && rows[0].status !== 'ACHIEVED') {
      await db.$executeRaw`
        INSERT INTO student_xp (student_id, source, points) VALUES (${studentId}, 'GOAL_ACHIEVED', 50)
      `
      await db.$executeRaw`
        INSERT INTO student_badges (student_id, badge_type, details)
        VALUES (${studentId}, 'PROGRESS', 'Objectif académique atteint')
        ON CONFLICT (student_id, badge_type) DO NOTHING
      `
    }
    revalidatePath('/student/goals')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  try {
    const { db, studentId } = await getStudentDb()
    await db.$executeRaw`DELETE FROM student_goals WHERE id = ${id} AND student_id = ${studentId}`
    revalidatePath('/student/goals')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}
