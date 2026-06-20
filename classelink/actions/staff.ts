'use server'

import { revalidatePath } from 'next/cache'
import { hash } from 'bcryptjs'
import { nanoid } from 'nanoid'
import { requireRole } from '@/lib/auth/rbac'
import { getTenantPrisma } from '@/lib/db/tenant'
import { sanitizeModules } from '@/lib/permissions/modules'
import type { ActionResult } from '@/types'

// Seul un ADMIN gère le personnel et ses accès.
async function getDb() {
  const session = await requireRole('ADMIN')
  return { db: getTenantPrisma(session.user.schemaName) as any, session }
}

function dbError(e: any): string {
  if (e?.code === '23505' || e?.message?.includes('23505')) {
    return 'Cette adresse email est déjà utilisée.'
  }
  return e?.message ?? 'Une erreur est survenue.'
}

// ─── Lister le personnel (STAFF) ──────────────────────────────────────────────
export async function listStaff(): Promise<any[]> {
  const { db } = await getDb()
  return db.$queryRaw`
    SELECT id, first_name, last_name, email, phone, job_title,
           allowed_modules, is_active, created_at
    FROM users
    WHERE role = 'STAFF'
    ORDER BY last_name, first_name
  ` as Promise<any[]>
}

// ─── Créer un membre du personnel ─────────────────────────────────────────────
export async function createStaff(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult<{ tempPassword: string }>> {
  const { db } = await getDb()

  const firstName = (formData.get('firstName') as string)?.trim()
  const lastName  = (formData.get('lastName')  as string)?.trim()
  const email     = (formData.get('email')     as string)?.trim().toLowerCase()
  const phone     = (formData.get('phone')     as string)?.trim() || null
  const jobTitle  = (formData.get('jobTitle')  as string)?.trim()
  const modules   = sanitizeModules(formData.getAll('modules').map(String))

  if (!firstName || !lastName || !email) {
    return { success: false, error: 'Prénom, nom et email requis.' }
  }
  if (!jobTitle) {
    return { success: false, error: 'Le poste est requis.' }
  }
  if (modules.length === 0) {
    return { success: false, error: 'Sélectionnez au moins une fonctionnalité accessible.' }
  }

  try {
    const tempPassword = nanoid(12)
    const passwordHash = await hash(tempPassword, 12)

    await db.$executeRaw`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role, job_title, allowed_modules, email_verified)
      VALUES (${email}, ${passwordHash}, ${firstName}, ${lastName}, ${phone}, 'STAFF', ${jobTitle}, ${modules}, TRUE)
    `

    revalidatePath('/admin/settings/staff')
    return { success: true, data: { tempPassword } }
  } catch (e: any) {
    return { success: false, error: dbError(e) }
  }
}

// ─── Mettre à jour poste + modules d'un membre ────────────────────────────────
export async function updateStaff(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { db } = await getDb()

  const userId   = (formData.get('userId')   as string)?.trim()
  const jobTitle = (formData.get('jobTitle') as string)?.trim()
  const modules  = sanitizeModules(formData.getAll('modules').map(String))

  if (!userId)   return { success: false, error: 'Membre introuvable.' }
  if (!jobTitle) return { success: false, error: 'Le poste est requis.' }
  if (modules.length === 0) {
    return { success: false, error: 'Sélectionnez au moins une fonctionnalité accessible.' }
  }

  try {
    // Garde-fou : ne modifier que des comptes STAFF.
    const rows: any[] = await db.$queryRaw`
      SELECT id FROM users WHERE id = ${userId} AND role = 'STAFF' LIMIT 1
    `
    if (!rows[0]) return { success: false, error: 'Ce compte n\'est pas un membre du personnel.' }

    await db.$executeRaw`
      UPDATE users
      SET job_title = ${jobTitle}, allowed_modules = ${modules}, updated_at = NOW()
      WHERE id = ${userId} AND role = 'STAFF'
    `

    revalidatePath('/admin/settings/staff')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: dbError(e) }
  }
}

// ─── Activer / désactiver un membre (form action directe) ─────────────────────
export async function toggleStaffActive(formData: FormData): Promise<void> {
  const { db } = await getDb()
  const userId = (formData.get('userId') as string)?.trim()
  if (!userId) return

  // Restreint aux comptes STAFF (garde-fou).
  await db.$executeRaw`
    UPDATE users SET is_active = NOT is_active, updated_at = NOW()
    WHERE id = ${userId} AND role = 'STAFF'
  `
  revalidatePath('/admin/settings/staff')
}

// ─── Réinitialiser le mot de passe d'un membre ────────────────────────────────
export async function resetStaffPassword(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult<{ tempPassword: string }>> {
  const { db } = await getDb()
  const userId = (formData.get('userId') as string)?.trim()
  if (!userId) return { success: false, error: 'Membre introuvable.' }

  try {
    const rows: any[] = await db.$queryRaw`
      SELECT id FROM users WHERE id = ${userId} AND role = 'STAFF' LIMIT 1
    `
    if (!rows[0]) return { success: false, error: 'Ce compte n\'est pas un membre du personnel.' }

    const tempPassword = nanoid(12)
    const passwordHash = await hash(tempPassword, 12)
    await db.$executeRaw`
      UPDATE users SET password_hash = ${passwordHash}, updated_at = NOW()
      WHERE id = ${userId} AND role = 'STAFF'
    `
    return { success: true, data: { tempPassword } }
  } catch (e: any) {
    return { success: false, error: dbError(e) }
  }
}
