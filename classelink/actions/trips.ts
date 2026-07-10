'use server'

import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import { revalidatePath } from 'next/cache'
import { toActionError } from '@/lib/errors'
import { getParentSubscriptionStatus } from '@/actions/parent'
import type { ActionResult } from '@/types'

async function getDb() {
  const session = await requireRole('ADMIN', 'TEACHER')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, user: session.user }
}

async function getAdminDb() {
  const session = await requireRole('ADMIN')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, user: session.user }
}

// ─── Liste des sorties ────────────────────────────────────────────────────────
export async function getFieldTrips(): Promise<any[]> {
  const { db } = await getDb()

  const rows: any[] = await db.$queryRaw`
    SELECT
      ft.id, ft.title, ft.description, ft.destination,
      ft.trip_date, ft.return_date, ft.departure_time,
      ft.cost, ft.max_participants, ft.status,
      COUNT(ta.id) FILTER (WHERE ta.status = 'AUTHORIZED')::int AS authorized_count,
      COUNT(ta.id)::int                                          AS total_students
    FROM field_trips ft
    LEFT JOIN trip_authorizations ta ON ta.trip_id = ft.id
    GROUP BY ft.id
    ORDER BY ft.trip_date DESC NULLS LAST
  `
  return rows
}

// ─── Créer une sortie ─────────────────────────────────────────────────────────
export async function createTrip(
  prevState: ActionResult<{ id: string }> | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const { db } = await getAdminDb()

  const title           = formData.get('title')           as string
  const description     = formData.get('description')     as string | null
  const destination     = formData.get('destination')     as string
  const tripDate        = formData.get('tripDate')        as string
  const returnDate      = formData.get('returnDate')      as string | null
  const departureTime   = formData.get('departureTime')   as string | null
  const cost            = parseFloat(formData.get('cost') as string ?? '0')
  const maxParticipants = parseInt(formData.get('maxParticipants') as string ?? '0', 10)
  const classIds        = formData.getAll('classIds') as string[]

  if (!title || !destination || !tripDate) {
    return { success: false, error: 'Titre, destination et date sont requis.' }
  }

  try {
    // Créer la sortie
    const tripRows: any[] = await db.$queryRaw`
      INSERT INTO field_trips
        (title, description, destination, trip_date, return_date, departure_time,
         cost, max_participants, status)
      VALUES
        (${title}, ${description ?? null}, ${destination},
         ${new Date(tripDate)},
         ${returnDate ? new Date(returnDate) : null},
         ${departureTime ?? null},
         ${cost}, ${maxParticipants}, 'PLANNED')
      RETURNING id
    `
    const tripId = tripRows[0].id

    // Associer les classes
    for (const classId of classIds) {
      await db.$executeRaw`
        INSERT INTO trip_class_links (trip_id, class_id)
        VALUES (${tripId}, ${classId})
        ON CONFLICT DO NOTHING
      `
    }

    // Créer les autorisations PENDING pour chaque élève inscrit dans les classes
    if (classIds.length > 0) {
      for (const classId of classIds) {
        const students: any[] = await db.$queryRaw`
          SELECT s.id AS student_id
          FROM enrollments e
          JOIN students s ON s.id = e.student_id
          WHERE e.class_id = ${classId} AND e.status = 'ACTIVE'
        `
        for (const student of students) {
          await db.$executeRaw`
            INSERT INTO trip_authorizations (trip_id, student_id, status)
            VALUES (${tripId}, ${student.student_id}, 'PENDING')
            ON CONFLICT (trip_id, student_id) DO NOTHING
          `
        }
      }
    }

    revalidatePath('/admin/trips')
    return { success: true, data: { id: tripId } }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Mettre à jour le statut d'une sortie ────────────────────────────────────
export async function updateTripStatus(
  tripId: string,
  status: string
): Promise<ActionResult> {
  const { db } = await getAdminDb()

  try {
    await db.$executeRaw`
      UPDATE field_trips
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${tripId}
    `
    revalidatePath('/admin/trips')
    revalidatePath(`/admin/trips/${tripId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Supprimer une sortie ─────────────────────────────────────────────────────
export async function deleteTrip(tripId: string): Promise<ActionResult> {
  const { db } = await getAdminDb()

  try {
    await db.$executeRaw`DELETE FROM trip_authorizations WHERE trip_id = ${tripId}`
    await db.$executeRaw`DELETE FROM trip_class_links    WHERE trip_id = ${tripId}`
    await db.$executeRaw`DELETE FROM field_trips         WHERE id      = ${tripId}`
    revalidatePath('/admin/trips')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Détail d'une sortie ──────────────────────────────────────────────────────
export async function getTripDetails(tripId: string): Promise<any> {
  const { db } = await getDb()

  const [tripRows, classes, students] = await Promise.all([
    db.$queryRaw`
      SELECT ft.*
      FROM field_trips ft
      WHERE ft.id = ${tripId}
      LIMIT 1
    ` as Promise<any[]>,

    db.$queryRaw`
      SELECT c.id, c.name AS class_name, l.name AS level_name
      FROM trip_class_links tcl
      JOIN classes c ON c.id = tcl.class_id
      JOIN levels l  ON l.id = c.level_id
      WHERE tcl.trip_id = ${tripId}
      ORDER BY c.name
    ` as Promise<any[]>,

    db.$queryRaw`
      SELECT
        s.id                                                          AS student_id,
        u.first_name, u.last_name, s.student_id AS student_number,
        c.name                                                        AS class_name,
        ta.id                                                         AS authorization_id,
        ta.status                                                     AS authorization_status,
        ta.signed_at, ta.notes,
        pu.first_name || ' ' || pu.last_name                         AS parent_name,
        pu.phone                                                      AS parent_phone
      FROM trip_authorizations ta
      JOIN students s ON s.id = ta.student_id
      JOIN users u    ON u.id = s.user_id
      LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'ACTIVE'
      LEFT JOIN classes c     ON c.id = e.class_id
      LEFT JOIN parent_students ps ON ps.student_id = s.id
      LEFT JOIN parents p          ON p.id = ps.parent_id
      LEFT JOIN users pu           ON pu.id = p.user_id
      WHERE ta.trip_id = ${tripId}
      ORDER BY u.last_name, u.first_name
    ` as Promise<any[]>,
  ])

  const trip = tripRows[0] ?? null
  return { trip, classes, students }
}

// ─── Sorties pour un parent ───────────────────────────────────────────────────
export async function getParentTrips(): Promise<any[]> {
  const session = await requireRole('PARENT')
  const db = getTenantPrisma(session.user.schemaName) as any

  const rows: any[] = await db.$queryRaw`
    SELECT
      ft.id, ft.title, ft.description, ft.destination,
      ft.trip_date, ft.return_date, ft.departure_time,
      ft.cost, ft.max_participants, ft.status,
      s.id          AS student_id,
      u.first_name  AS student_first_name,
      u.last_name   AS student_last_name,
      ta.id         AS authorization_id,
      ta.status     AS authorization_status,
      ta.signed_at, ta.notes
    FROM parent_students ps
    JOIN parents p  ON p.id = ps.parent_id
    JOIN students s ON s.id = ps.student_id
    JOIN users u    ON u.id = s.user_id
    JOIN enrollments e ON e.student_id = s.id AND e.status = 'ACTIVE'
    JOIN trip_class_links tcl ON tcl.class_id = e.class_id
    JOIN field_trips ft ON ft.id = tcl.trip_id
    LEFT JOIN trip_authorizations ta
      ON ta.trip_id = ft.id AND ta.student_id = s.id
    WHERE p.user_id = ${session.user.id}
      AND ft.status IN ('PLANNED', 'CONFIRMED')
    ORDER BY ft.trip_date ASC
  `
  return rows.map(r => ({ ...r, cost: r.cost !== null ? Number(r.cost) : null }))
}

// ─── Autoriser / refuser une sortie (PARENT) ──────────────────────────────────
export async function authorizeTrip(
  tripId: string,
  studentId: string,
  authorized: boolean,
  notes?: string,
  signatureData?: string
): Promise<ActionResult> {
  try {
    const session = await requireRole('PARENT')
    const db = getTenantPrisma(session.user.schemaName) as any

    // Vérifier la parenté
    const check: any[] = await db.$queryRaw`
      SELECT ps.id FROM parent_students ps
      JOIN parents p ON p.id = ps.parent_id
      WHERE p.user_id = ${session.user.id} AND ps.student_id = ${studentId}
      LIMIT 1
    `
    if (!check[0]) return { success: false, error: 'Accès non autorisé.' }

    if (authorized && !signatureData) {
      return { success: false, error: 'Une signature est requise pour autoriser la sortie.' }
    }

    // La signature (autorisation) nécessite l'abonnement MyClassLink actif — vérifié
    // ici côté serveur (le refus, lui, reste toujours accessible gratuitement).
    if (authorized) {
      const subscription = await getParentSubscriptionStatus()
      if (!subscription.success || !subscription.data?.paid) {
        return { success: false, error: 'Un abonnement MyClassLink actif est requis pour autoriser cette sortie.' }
      }
    }

    const newStatus = authorized ? 'AUTHORIZED' : 'REFUSED'

    const affected = await db.$executeRaw`
      UPDATE trip_authorizations
      SET status         = ${newStatus},
          signed_at      = NOW(),
          notes          = ${notes ?? null},
          signature_data = ${authorized ? signatureData : null},
          updated_at     = NOW()
      WHERE trip_id   = ${tripId}
        AND student_id = ${studentId}
    `
    if (affected === 0) {
      return { success: false, error: 'Autorisation introuvable pour cet élève et cette sortie.' }
    }
    revalidatePath('/parent/trips')
    revalidatePath('/parent/liaison')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Liste des autorisations d'une sortie (ADMIN) ─────────────────────────────
export async function getTripAuthorizations(tripId: string): Promise<any[]> {
  const { db } = await getAdminDb()

  const rows: any[] = await db.$queryRaw`
    SELECT
      ta.id, ta.status, ta.signed_at, ta.notes,
      s.id          AS student_id,
      u.first_name  AS student_first_name,
      u.last_name   AS student_last_name,
      s.student_id  AS student_number,
      c.name        AS class_name,
      pu.first_name || ' ' || pu.last_name AS parent_name,
      pu.phone      AS parent_phone,
      pu.email      AS parent_email
    FROM trip_authorizations ta
    JOIN students s ON s.id = ta.student_id
    JOIN users u    ON u.id = s.user_id
    LEFT JOIN enrollments e ON e.student_id = s.id AND e.status = 'ACTIVE'
    LEFT JOIN classes c     ON c.id = e.class_id
    LEFT JOIN parent_students ps ON ps.student_id = s.id
    LEFT JOIN parents p          ON p.id = ps.parent_id
    LEFT JOIN users pu           ON pu.id = p.user_id
    WHERE ta.trip_id = ${tripId}
    ORDER BY u.last_name, u.first_name
  `
  return rows
}
