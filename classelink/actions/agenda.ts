'use server'

import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import { revalidatePath } from 'next/cache'
import { toActionError } from '@/lib/errors'
import type { ActionResult } from '@/types'

async function getDb() {
  const session = await requireRole('ADMIN', 'CENSOR')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, userId: session.user.id }
}

export async function getAgendaEvents(month?: string): Promise<any[]> {
  const { db } = await getDb()
  return db.$queryRaw`
    SELECT ae.id, ae.title, ae.description, ae.event_type,
           ae.start_date, ae.end_date, ae.start_time, ae.end_time,
           ae.all_classes, c.name AS class_name,
           ex.id AS exam_id, s.name AS subject_name, ex.room, ex.coefficient, ex.max_value
    FROM agenda_events ae
    LEFT JOIN classes c ON c.id = ae.class_id
    LEFT JOIN exams ex ON ex.agenda_event_id = ae.id
    LEFT JOIN subjects s ON s.id = ex.subject_id
    WHERE (${month ?? null}::text IS NULL
           OR to_char(ae.start_date, 'YYYY-MM') = ${month ?? null})
    ORDER BY ae.start_date, ae.start_time NULLS LAST
  ` as Promise<any[]>
}

export interface CreateAgendaEventInput {
  title: string
  description: string
  eventType: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  classId: string
  allClasses: boolean
  // Champs spécifiques au mode examen (eventType === 'EXAM')
  subjectId?: string
  room?: string
  maxValue?: string
  coefficient?: string
}

export async function createAgendaEvent(input: CreateAgendaEventInput): Promise<ActionResult<{ id: string }>> {
  const { title, description, eventType, startDate, endDate, startTime, endTime, classId, allClasses } = input
  try {
    const { db, userId } = await getDb()

    if (eventType === 'EXAM' && (!classId || !input.subjectId)) {
      return { success: false, error: 'Un examen doit préciser une classe et une matière.' }
    }

    const rows: any[] = await db.$queryRaw`
      INSERT INTO agenda_events
        (title, description, event_type, start_date, end_date, start_time, end_time,
         class_id, all_classes, created_by)
      VALUES
        (${title}, ${description || null}, ${eventType},
         ${new Date(startDate)}, ${endDate ? new Date(endDate) : null},
         ${startTime || null}, ${endTime || null},
         ${classId || null}, ${allClasses}, ${userId})
      RETURNING id
    `
    const agendaEventId = rows[0].id

    if (eventType === 'EXAM') {
      const terms: any[] = await db.$queryRaw`
        SELECT t.id FROM terms t
        JOIN academic_years ay ON ay.id = t.academic_year_id
        WHERE ay.is_current = TRUE
          AND ${new Date(startDate)} BETWEEN t.start_date AND t.end_date
        LIMIT 1
      `
      if (!terms[0]) {
        return { success: false, error: 'Aucun trimestre actif ne couvre cette date — examen non planifié.' }
      }
      await db.$executeRaw`
        INSERT INTO exams
          (agenda_event_id, class_id, subject_id, term_id, title, exam_date, start_time, end_time, room, max_value, coefficient, created_by)
        VALUES
          (${agendaEventId}, ${classId}, ${input.subjectId}, ${terms[0].id}, ${title},
           ${new Date(startDate)}, ${startTime || null}, ${endTime || null}, ${input.room || null},
           ${input.maxValue ? Number(input.maxValue) : 20}, ${input.coefficient ? Number(input.coefficient) : 1},
           ${userId})
      `
    }

    revalidatePath('/admin/agenda')
    return { success: true, data: { id: agendaEventId } }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}

export async function deleteAgendaEvent(id: string): Promise<ActionResult> {
  try {
    const { db } = await getDb()
    await db.$executeRaw`DELETE FROM agenda_events WHERE id = ${id}`
    revalidatePath('/admin/agenda')
    return { success: true, data: undefined }
  } catch (e) {
    return { success: false, error: toActionError(e) }
  }
}
