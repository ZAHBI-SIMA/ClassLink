'use server'

import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import { revalidatePath } from 'next/cache'
import { toActionError } from '@/lib/errors'
import type { ActionResult } from '@/types'

async function getDb() {
  const session = await requireRole('ADMIN')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, user: session.user }
}

// ─── Lire les paramètres de l'établissement ───────────────────────────────────
export async function getSchoolSettings(): Promise<any> {
  const { db } = await getDb()

  const rows: any[] = await db.$queryRaw`
    SELECT
      id, school_name, address, city, phone, email,
      director_name AS principal_name, logo_url, updated_at
    FROM school_settings
    LIMIT 1
  `
  return rows[0] ?? {}
}

// ─── Lire le plan d'abonnement actuel ─────────────────────────────────────────
export async function getSubscriptionInfo(): Promise<any> {
  const { db } = await getDb()

  const rows: any[] = await db.$queryRaw`
    SELECT
      s.id, s.status, s.plan_name, s.plan_slug,
      s.current_period_end, s.trial_ends_at,
      s.max_students, s.max_teachers
    FROM subscriptions s
    ORDER BY s.created_at DESC
    LIMIT 1
  `
  return rows[0] ?? null
}

// ─── Enregistrer les paramètres de l'établissement ───────────────────────────
export async function saveSchoolSettings(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { db } = await getDb()

  const school_name    = (formData.get('school_name')    as string)?.trim() || null
  const address        = (formData.get('address')        as string)?.trim() || null
  const city           = (formData.get('city')           as string)?.trim() || null
  const phone          = (formData.get('phone')          as string)?.trim() || null
  const email          = (formData.get('email')          as string)?.trim() || null
  const director_name  = (formData.get('principal_name') as string)?.trim() || null

  if (!school_name) {
    return { success: false, error: 'Le nom de l\'établissement est requis.' }
  }

  try {
    // Vérifier si un enregistrement existe
    const existing: any[] = await db.$queryRaw`
      SELECT id FROM school_settings LIMIT 1
    `

    if (existing[0]) {
      await db.$executeRaw`
        UPDATE school_settings
        SET
          school_name   = ${school_name},
          address       = ${address},
          city          = ${city},
          phone         = ${phone},
          email         = ${email},
          director_name = ${director_name}
        WHERE id = ${existing[0].id}
      `
    } else {
      await db.$executeRaw`
        INSERT INTO school_settings
          (school_name, address, city, phone, email, director_name)
        VALUES
          (${school_name}, ${address}, ${city}, ${phone}, ${email}, ${director_name})
      `
    }

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}
