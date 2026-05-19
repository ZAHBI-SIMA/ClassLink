'use server'

import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import { revalidatePath } from 'next/cache'
import { toActionError } from '@/lib/errors'
import type { ActionResult } from '@/types'

async function getDb() {
  const session = await requireRole('ADMIN', 'CENSOR')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, user: session.user }
}

async function getAdminDb() {
  const session = await requireRole('ADMIN')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, user: session.user }
}

async function getAnyRoleDb() {
  const session = await requireRole('ADMIN', 'CENSOR', 'TEACHER', 'STUDENT', 'PARENT')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, user: session.user }
}

async function getAdminOrTeacherDb() {
  const session = await requireRole('ADMIN', 'TEACHER')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, user: session.user }
}

// ─── Liste des ressources ─────────────────────────────────────────────────────
export async function getResources(type?: string): Promise<any[]> {
  const { db } = await getAnyRoleDb()

  const rows: any[] = await db.$queryRaw`
    SELECT
      r.id, r.name, r.type, r.capacity, r.location, r.description, r.created_at,
      COUNT(rb.id) FILTER (
        WHERE rb.status = 'CONFIRMED'
          AND rb.booking_date = CURRENT_DATE
      )::int AS active_bookings_today
    FROM resources r
    LEFT JOIN resource_bookings rb ON rb.resource_id = r.id
    WHERE (${type ?? null} IS NULL OR r.type = ${type ?? null})
    GROUP BY r.id
    ORDER BY r.name
  `
  return rows
}

// ─── Créer une ressource ──────────────────────────────────────────────────────
export async function createResource(
  prevState: ActionResult<{ id: string }> | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const { db } = await getAdminDb()

  const name        = formData.get('name')        as string
  const type        = formData.get('type')        as string
  const capacity    = parseInt(formData.get('capacity') as string ?? '0', 10)
  const location    = formData.get('location')    as string | null
  const description = formData.get('description') as string | null

  if (!name || !type) {
    return { success: false, error: 'Nom et type sont requis.' }
  }

  try {
    const rows: any[] = await db.$queryRaw`
      INSERT INTO resources (name, type, capacity, location, description)
      VALUES (${name}, ${type}, ${capacity}, ${location ?? null}, ${description ?? null})
      RETURNING id
    `
    revalidatePath('/admin/resources')
    return { success: true, data: { id: rows[0].id } }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Mettre à jour une ressource ─────────────────────────────────────────────
export async function updateResource(
  resourceId: string,
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { db } = await getAdminDb()

  const name        = formData.get('name')        as string
  const type        = formData.get('type')        as string
  const capacity    = parseInt(formData.get('capacity') as string ?? '0', 10)
  const location    = formData.get('location')    as string | null
  const description = formData.get('description') as string | null

  try {
    await db.$executeRaw`
      UPDATE resources
      SET name        = ${name},
          type        = ${type},
          capacity    = ${capacity},
          location    = ${location ?? null},
          description = ${description ?? null},
          updated_at  = NOW()
      WHERE id = ${resourceId}
    `
    revalidatePath('/admin/resources')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Supprimer une ressource ──────────────────────────────────────────────────
export async function deleteResource(resourceId: string): Promise<ActionResult> {
  const { db } = await getAdminDb()

  try {
    // Vérifier pas de réservation future
    const futureBookings: any[] = await db.$queryRaw`
      SELECT id FROM resource_bookings
      WHERE resource_id = ${resourceId}
        AND booking_date >= CURRENT_DATE
        AND status != 'CANCELLED'
      LIMIT 1
    `
    if (futureBookings[0]) {
      return {
        success: false,
        error: 'Cette ressource a des réservations futures et ne peut pas être supprimée.',
      }
    }

    await db.$executeRaw`DELETE FROM resources WHERE id = ${resourceId}`
    revalidatePath('/admin/resources')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Réservations ─────────────────────────────────────────────────────────────
export async function getResourceBookings(
  resourceId?: string,
  date?: string
): Promise<any[]> {
  const { db } = await getAnyRoleDb()

  const rows: any[] = await db.$queryRaw`
    SELECT
      rb.id, rb.title, rb.booking_date, rb.start_time, rb.end_time,
      rb.purpose, rb.status, rb.created_at,
      r.name    AS resource_name, r.type AS resource_type, r.location,
      u.first_name || ' ' || u.last_name AS booked_by_name,
      u.id AS booked_by_id
    FROM resource_bookings rb
    JOIN resources r ON r.id = rb.resource_id
    JOIN users u     ON u.id = rb.booked_by
    WHERE (${resourceId ?? null}::uuid IS NULL OR rb.resource_id = ${resourceId ?? null}::uuid)
      AND (${date ?? null} IS NULL OR rb.booking_date = ${date ?? null}::date)
    ORDER BY rb.booking_date, rb.start_time
  `
  return rows
}

// ─── Créer une réservation ────────────────────────────────────────────────────
export async function createBooking(
  prevState: ActionResult<{ id: string }> | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole('ADMIN', 'TEACHER')
  const db = getTenantPrisma(session.user.schemaName) as any

  const resourceId  = formData.get('resourceId')   as string
  const title       = formData.get('title')        as string
  const bookingDate = formData.get('bookingDate')  as string
  const startTime   = formData.get('startTime')    as string
  const endTime     = formData.get('endTime')      as string
  const purpose     = formData.get('purpose')      as string | null

  if (!resourceId || !title || !bookingDate || !startTime || !endTime) {
    return { success: false, error: 'Tous les champs obligatoires doivent être renseignés.' }
  }

  try {
    // Vérifier les conflits d'horaire
    const conflicts: any[] = await db.$queryRaw`
      SELECT id FROM resource_bookings
      WHERE resource_id  = ${resourceId}
        AND booking_date = ${new Date(bookingDate)}
        AND status      != 'CANCELLED'
        AND start_time  < ${endTime}
        AND end_time    > ${startTime}
      LIMIT 1
    `
    if (conflicts[0]) {
      return { success: false, error: 'Un conflit d\'horaire existe pour cette ressource à cette plage.' }
    }

    const rows: any[] = await db.$queryRaw`
      INSERT INTO resource_bookings
        (resource_id, title, booking_date, start_time, end_time, purpose, booked_by, status)
      VALUES
        (${resourceId}, ${title}, ${new Date(bookingDate)}, ${startTime}, ${endTime},
         ${purpose ?? null}, ${session.user.id}, 'CONFIRMED')
      RETURNING id
    `
    revalidatePath('/admin/resources')
    revalidatePath('/teacher/resources')
    return { success: true, data: { id: rows[0].id } }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Annuler une réservation ──────────────────────────────────────────────────
export async function cancelBooking(bookingId: string): Promise<ActionResult> {
  const session = await requireRole('ADMIN', 'TEACHER')
  const db = getTenantPrisma(session.user.schemaName) as any

  try {
    // Récupérer la réservation
    const bookingRows: any[] = await db.$queryRaw`
      SELECT id, booked_by, status FROM resource_bookings WHERE id = ${bookingId} LIMIT 1
    `
    const booking = bookingRows[0]
    if (!booking) return { success: false, error: 'Réservation introuvable.' }

    // Un TEACHER ne peut annuler que ses propres réservations
    if (
      session.user.role === 'TEACHER' &&
      booking.booked_by !== session.user.id
    ) {
      return { success: false, error: 'Vous ne pouvez annuler que vos propres réservations.' }
    }

    await db.$executeRaw`
      UPDATE resource_bookings
      SET status = 'CANCELLED', updated_at = NOW()
      WHERE id = ${bookingId}
    `
    revalidatePath('/admin/resources')
    revalidatePath('/teacher/resources')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}
