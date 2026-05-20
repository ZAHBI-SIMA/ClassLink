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
           ae.all_classes, c.name AS class_name
    FROM agenda_events ae
    LEFT JOIN classes c ON c.id = ae.class_id
    WHERE (${month ?? null}::text IS NULL
           OR to_char(ae.start_date, 'YYYY-MM') = ${month ?? null})
    ORDER BY ae.start_date, ae.start_time NULLS LAST
  ` as Promise<any[]>
}

export async function createAgendaEvent(
  title: string,
  description: string,
  eventType: string,
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
  classId: string,
  allClasses: boolean
): Promise<ActionResult<{ id: string }>> {
  try {
    const { db, userId } = await getDb()
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
    revalidatePath('/admin/agenda')
    return { success: true, data: { id: rows[0].id } }
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
