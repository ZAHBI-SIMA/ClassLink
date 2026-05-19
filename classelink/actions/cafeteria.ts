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

// ─── Menus de la semaine ──────────────────────────────────────────────────────
export async function getCafeteriaMenus(weekStart?: string): Promise<any[]> {
  const { db } = await getAnyRoleDb()

  const rows: any[] = await db.$queryRaw`
    SELECT
      cm.id, cm.week_start, cm.day_of_week, cm.meal_type,
      cm.description, cm.price, cm.created_at
    FROM cafeteria_menus cm
    WHERE cm.week_start = (
      CASE
        WHEN ${weekStart ?? null} IS NOT NULL
          THEN ${weekStart ?? null}::date
        ELSE date_trunc('week', NOW())::date
      END
    )
    ORDER BY cm.day_of_week, cm.meal_type
  `
  return rows
}

// ─── Créer ou mettre à jour un menu ──────────────────────────────────────────
export async function upsertMenu(
  prevState: ActionResult<{ id: string }> | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const { db } = await getAdminDb()

  const weekStart  = formData.get('weekStart')  as string
  const dayOfWeek  = parseInt(formData.get('dayOfWeek') as string, 10)
  const mealType   = formData.get('mealType')   as string
  const description = formData.get('description') as string
  const price      = parseFloat(formData.get('price') as string ?? '0')

  if (!weekStart || isNaN(dayOfWeek) || !mealType || !description) {
    return { success: false, error: 'Tous les champs obligatoires doivent être renseignés.' }
  }

  try {
    const rows: any[] = await db.$queryRaw`
      INSERT INTO cafeteria_menus (week_start, day_of_week, meal_type, description, price)
      VALUES (${new Date(weekStart)}, ${dayOfWeek}, ${mealType}, ${description}, ${price})
      ON CONFLICT (week_start, day_of_week, meal_type) DO UPDATE
        SET description = EXCLUDED.description,
            price       = EXCLUDED.price,
            updated_at  = NOW()
      RETURNING id
    `
    revalidatePath('/admin/cafeteria')
    return { success: true, data: { id: rows[0].id } }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Supprimer un menu ────────────────────────────────────────────────────────
export async function deleteMenu(menuId: string): Promise<ActionResult> {
  const { db } = await getAdminDb()

  try {
    await db.$executeRaw`DELETE FROM cafeteria_menus WHERE id = ${menuId}`
    revalidatePath('/admin/cafeteria')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Liste des souscriptions ──────────────────────────────────────────────────
export async function getCafeteriaSubscriptions(): Promise<any[]> {
  const { db } = await getAdminDb()

  const rows: any[] = await db.$queryRaw`
    SELECT
      cs.id, cs.meal_type, cs.start_date, cs.status, cs.amount,
      s.id          AS student_id,
      u.first_name, u.last_name,
      c.name        AS class_name,
      ay.name       AS academic_year_name
    FROM cafeteria_subscriptions cs
    JOIN students s ON s.id = cs.student_id
    JOIN users u    ON u.id = s.user_id
    LEFT JOIN enrollments e   ON e.student_id = s.id AND e.status = 'ACTIVE'
    LEFT JOIN classes c       ON c.id = e.class_id
    JOIN academic_years ay    ON ay.id = cs.academic_year_id
    ORDER BY u.last_name, u.first_name, cs.start_date DESC
  `
  return rows
}

// ─── Inscrire un élève à la cantine ──────────────────────────────────────────
export async function subscribeStudent(
  studentId: string,
  mealType: string,
  startDate: string,
  amount: number
): Promise<ActionResult<{ id: string }>> {
  const { db } = await getAdminDb()

  try {
    const yearRows: any[] = await db.$queryRaw`
      SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1
    `
    const academicYearId = yearRows[0]?.id
    if (!academicYearId) return { success: false, error: 'Aucune année académique courante trouvée.' }

    const rows: any[] = await db.$queryRaw`
      INSERT INTO cafeteria_subscriptions
        (student_id, meal_type, start_date, amount, status, academic_year_id)
      VALUES
        (${studentId}, ${mealType}, ${new Date(startDate)}, ${amount}, 'ACTIVE', ${academicYearId})
      RETURNING id
    `
    revalidatePath('/admin/cafeteria')
    return { success: true, data: { id: rows[0].id } }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Mettre à jour le statut d'une souscription ───────────────────────────────
export async function updateSubscriptionStatus(
  subId: string,
  status: string
): Promise<ActionResult> {
  const { db } = await getAdminDb()

  try {
    await db.$executeRaw`
      UPDATE cafeteria_subscriptions
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${subId}
    `
    revalidatePath('/admin/cafeteria')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Infos cantine d'un élève (PARENT) ───────────────────────────────────────
export async function getStudentCafeteriaInfo(
  studentId: string
): Promise<ActionResult<{ subscription: any; menus: any[] }>> {
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

    const [subscriptions, menus] = await Promise.all([
      db.$queryRaw`
        SELECT cs.id, cs.meal_type, cs.start_date, cs.status, cs.amount,
               ay.name AS academic_year_name
        FROM cafeteria_subscriptions cs
        JOIN academic_years ay ON ay.id = cs.academic_year_id
        WHERE cs.student_id = ${studentId} AND cs.status = 'ACTIVE'
        ORDER BY cs.start_date DESC
        LIMIT 1
      ` as Promise<any[]>,
      db.$queryRaw`
        SELECT cm.id, cm.week_start, cm.day_of_week, cm.meal_type, cm.description, cm.price
        FROM cafeteria_menus cm
        WHERE cm.week_start = date_trunc('week', NOW())::date
        ORDER BY cm.day_of_week, cm.meal_type
      ` as Promise<any[]>,
    ])

    return {
      success: true,
      data: {
        subscription: subscriptions[0] ?? null,
        menus,
      },
    }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}
