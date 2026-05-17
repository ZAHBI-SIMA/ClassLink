'use server'

import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { publicPrisma } from '@/lib/db/public'
import { createTenantSchema, dropTenantSchema, getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import { toActionError } from '@/lib/errors'
import type { ActionResult, PaginatedResult } from '@/types'
import { readFileSync } from 'fs'
import { join } from 'path'

const db = publicPrisma as any

// ─── Schémas de validation ────────────────────────────────────────────────────
const createSchoolSchema = z.object({
  name: z.string().min(3, 'Nom requis (min 3 caractères)'),
  adminEmail: z.string().email('Email administrateur invalide'),
  adminFirstName: z.string().min(2, 'Prénom requis'),
  adminLastName: z.string().min(2, 'Nom requis'),
  adminPassword: z.string().min(8, 'Mot de passe minimum 8 caractères'),
  planId: z.string().min(1, 'Plan requis'),
  city: z.string().optional(),
  country: z.string().default('CI'),
  phone: z.string().optional(),
})

const updateSchoolSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(3).optional(),
  status: z.enum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
  planId: z.string().optional(),
  superAdminNotes: z.string().optional(),
})

// ─── KPIs globaux ─────────────────────────────────────────────────────────────
export async function getSuperAdminKPIs() {
  await requireRole('SUPER_ADMIN')

  const [
    totalSchools,
    activeSchools,
    trialSchools,
    suspendedSchools,
    recentSchools,
    recentPayments,
  ] = await Promise.all([
    db.school.count(),
    db.school.count({ where: { status: 'ACTIVE' } }),
    db.school.count({ where: { status: 'TRIAL' } }),
    db.school.count({ where: { status: 'SUSPENDED' } }),
    db.school.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { plan: { select: { name: true } } },
    }),
    db.globalPayment.findMany({
      take: 5,
      where: { status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: {
          include: { school: { select: { name: true } } },
        },
      },
    }),
  ])

  // Calcul MRR : somme des plans actifs
  const activeSubscriptions = await db.subscription.findMany({
    where: { status: 'ACTIVE' },
    include: { school: { include: { plan: true } } },
  })

  const mrr = activeSubscriptions.reduce((sum: number, sub: any) => {
    const price =
      sub.billing === 'YEARLY'
        ? Math.round(sub.school.plan.priceYearly / 12)
        : sub.school.plan.priceMonthly
    return sum + price
  }, 0)

  return {
    totalSchools,
    activeSchools,
    trialSchools,
    suspendedSchools,
    mrr,
    arr: mrr * 12,
    recentSchools,
    recentPayments,
  }
}

// ─── Liste des écoles (paginée) ───────────────────────────────────────────────
export async function getSchools(params: {
  page?: number
  search?: string
  status?: string
  planId?: string
} = {}): Promise<PaginatedResult<any>> {
  await requireRole('SUPER_ADMIN')

  const page = params.page ?? 1
  const perPage = 20
  const skip = (page - 1) * perPage

  const where: any = {}
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { adminEmail: { contains: params.search, mode: 'insensitive' } },
      { subdomain: { contains: params.search, mode: 'insensitive' } },
    ]
  }
  if (params.status) where.status = params.status
  if (params.planId) where.planId = params.planId

  const [data, total] = await Promise.all([
    db.school.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: 'desc' },
      include: { plan: { select: { name: true, slug: true } } },
    }),
    db.school.count({ where }),
  ])

  return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) }
}

// ─── Détail d'une école ────────────────────────────────────────────────────────
export async function getSchoolById(id: string) {
  await requireRole('SUPER_ADMIN')
  return db.school.findUnique({
    where: { id },
    include: {
      plan: true,
      subscription: { include: { payments: { take: 10, orderBy: { createdAt: 'desc' } } } },
    },
  })
}

// ─── Créer une école ──────────────────────────────────────────────────────────
export async function createSchool(
  prevState: ActionResult<{ schoolId: string; slug: string }> | null,
  formData: FormData
): Promise<ActionResult<{ schoolId: string; slug: string }>> {
  await requireRole('SUPER_ADMIN')

  const parsed = createSchoolSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { adminEmail, adminFirstName, adminLastName, adminPassword, planId, ...schoolData } =
    parsed.data

  try {
    // Générer un slug unique
    const baseSlug = schoolData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30)
    const slug = `${baseSlug}-${nanoid(4).toLowerCase()}`
    const schemaName = `school_${nanoid(8).toLowerCase()}`

    // 1. Créer l'entrée dans le schéma public
    const school = await db.school.create({
      data: {
        ...schoolData,
        slug,
        schemaName,
        adminEmail,
        planId,
        status: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      },
    })

    // 2. Créer le schéma PostgreSQL
    await createTenantSchema(schemaName)

    // 3. Appliquer le schéma tenant via le SQL
    const sqlPath = join(process.cwd(), 'prisma', 'tenant-schema.sql')
    const sql = readFileSync(sqlPath, 'utf-8')
    const tenantDb = getTenantPrisma(schemaName) as any

    // Exécuter le SQL par blocs (séparés par ---)
    const statements = sql
      .split(';')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0 && !s.startsWith('--'))

    for (const stmt of statements) {
      await tenantDb.$executeRawUnsafe(stmt + ';')
    }

    // 4. Créer l'administrateur de l'école
    const passwordHash = await hash(adminPassword, 12)
    await tenantDb.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: adminFirstName,
        lastName: adminLastName,
        role: 'ADMIN',
        emailVerified: true,
      },
    })

    // 5. Log global
    await db.globalAuditLog.create({
      data: {
        schoolId: school.id,
        action: 'CREATE',
        resource: 'SCHOOL',
        resourceId: school.id,
        metadata: { slug, schemaName },
      },
    })

    revalidatePath('/super-admin/schools')
    return { success: true, data: { schoolId: school.id, slug } }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Mettre à jour une école ──────────────────────────────────────────────────
export async function updateSchool(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireRole('SUPER_ADMIN')

  const parsed = updateSchoolSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const { id, ...data } = parsed.data
    await db.school.update({ where: { id }, data })

    await db.globalAuditLog.create({
      data: { schoolId: id, action: 'UPDATE', resource: 'SCHOOL', resourceId: id, metadata: data },
    })

    revalidatePath('/super-admin/schools')
    revalidatePath(`/super-admin/schools/${id}`)
    return { success: true, data: undefined }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Suspendre / Activer une école ────────────────────────────────────────────
export async function toggleSchoolStatus(schoolId: string, suspend: boolean): Promise<void> {
  await requireRole('SUPER_ADMIN')

  try {
    await db.school.update({
      where: { id: schoolId },
      data: { status: suspend ? 'SUSPENDED' : 'ACTIVE' },
    })

    await db.globalAuditLog.create({
      data: {
        schoolId,
        action: suspend ? 'SUSPEND' : 'ACTIVATE',
        resource: 'SCHOOL',
        resourceId: schoolId,
      },
    })

    revalidatePath('/super-admin/schools')
  } catch {
    // Erreur silencieuse — sera visible via Sentry en prod
  }
}

// ─── Prolonger la période d'essai ─────────────────────────────────────────────
export async function extendTrial(schoolId: string, days: number): Promise<void> {
  await requireRole('SUPER_ADMIN')

  try {
    const school = await db.school.findUnique({ where: { id: schoolId } })
    if (!school) return

    const base = school.trialEndsAt && school.trialEndsAt > new Date()
      ? school.trialEndsAt
      : new Date()
    const newDate = new Date(base.getTime() + days * 24 * 60 * 60 * 1000)

    await db.school.update({
      where: { id: schoolId },
      data: { trialEndsAt: newDate, status: 'TRIAL' },
    })

    revalidatePath(`/super-admin/schools/${schoolId}`)
  } catch {
    // Erreur silencieuse
  }
}

// ─── Plans tarifaires ─────────────────────────────────────────────────────────
export async function getPlans() {
  await requireRole('SUPER_ADMIN')
  return db.plan.findMany({ orderBy: { priceMonthly: 'asc' } })
}
