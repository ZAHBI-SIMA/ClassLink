'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireRole } from '@/lib/auth/rbac'
import { getTenantPrisma } from '@/lib/db/tenant'
import { publicPrisma } from '@/lib/db/public'
import { toActionError } from '@/lib/errors'
import { sendNotification } from '@/lib/notifications/service'
import type { ActionResult, PaginatedResult } from '@/types'

// ─── Validation du formulaire d'inscription publique ─────────────────────────
const enrollSchema = z.object({
  firstName:       z.string().min(2, 'Prénom requis'),
  lastName:        z.string().min(2, 'Nom requis'),
  dateOfBirth:     z.string().optional(),
  gender:          z.enum(['M', 'F']).optional(),
  desiredLevel:    z.string().optional(),
  previousSchool:  z.string().optional(),
  previousAverage: z.coerce.number().min(0).max(20).optional(),
  parentName:      z.string().min(2, 'Nom du parent requis'),
  parentPhone:     z.string().min(8, 'Téléphone parent requis'),
  parentEmail:     z.string().email('Email invalide').optional().or(z.literal('')),
  parentRelation:  z.string().default('PARENT'),
  address:         z.string().optional(),
  notes:           z.string().optional(),
})

// ─── Soumission publique (pas d'auth) ─────────────────────────────────────────
export async function submitEnrollmentApplication(
  slug: string,
  prevState: ActionResult<{ applicationId: string }> | null,
  formData: FormData
): Promise<ActionResult<{ applicationId: string }>> {
  const parsed = enrollSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    // Trouver le tenant via le slug de l'école
    const school = await (publicPrisma as any).school.findFirst({
      where: { slug, status: { in: ['ACTIVE', 'TRIAL'] } },
      select: { schemaName: true, id: true, name: true },
    })
    if (!school) return { success: false, error: 'École introuvable ou inactive.' }

    const db = getTenantPrisma(school.schemaName) as any

    // Trouver l'année scolaire courante
    const [yearRow] = await db.$queryRaw`
      SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1
    ` as any[]

    const {
      firstName, lastName, dateOfBirth, gender, desiredLevel,
      previousSchool, previousAverage, parentName, parentPhone,
      parentEmail, parentRelation, address, notes,
    } = parsed.data

    const [inserted] = await db.$queryRaw`
      INSERT INTO enrollment_applications
        (academic_year_id, first_name, last_name, date_of_birth, gender,
         desired_level, previous_school, previous_average, parent_name,
         parent_phone, parent_email, parent_relation, address, notes)
      VALUES (
        ${yearRow?.id ?? null},
        ${firstName}, ${lastName},
        ${dateOfBirth ? new Date(dateOfBirth) : null},
        ${gender ?? null}, ${desiredLevel ?? null},
        ${previousSchool ?? null},
        ${previousAverage ?? null},
        ${parentName}, ${parentPhone},
        ${parentEmail || null}, ${parentRelation},
        ${address ?? null}, ${notes ?? null}
      )
      RETURNING id
    ` as any[]

    return { success: true, data: { applicationId: inserted.id } }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Liste des candidatures (admin) ───────────────────────────────────────────
export async function getEnrollmentApplications(params: {
  status?: string
  search?: string
  page?:   number
} = {}): Promise<PaginatedResult<any>> {
  const session = await requireRole('ADMIN', 'CENSOR', 'ACCOUNTANT')
  const db      = getTenantPrisma(session.user.schemaName) as any

  const page    = params.page ?? 1
  const perPage = 20
  const offset  = (page - 1) * perPage

  const status = params.status || null
  const search = params.search ? `%${params.search}%` : null

  const [rows, countRows] = await Promise.all([
    db.$queryRaw`
      SELECT
        ea.*,
        ay.name AS academic_year_name,
        u.first_name AS reviewer_first_name,
        u.last_name  AS reviewer_last_name
      FROM enrollment_applications ea
      LEFT JOIN academic_years ay ON ea.academic_year_id = ay.id
      LEFT JOIN users           u  ON ea.reviewed_by     = u.id
      WHERE (${status}::text IS NULL OR ea.status = ${status})
        AND (${search}::text IS NULL
             OR ea.first_name ILIKE ${search}
             OR ea.last_name  ILIKE ${search}
             OR ea.parent_name ILIKE ${search}
             OR ea.parent_phone ILIKE ${search})
      ORDER BY ea.submitted_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `,
    db.$queryRaw`
      SELECT COUNT(*)::int AS total
      FROM enrollment_applications ea
      WHERE (${status}::text IS NULL OR ea.status = ${status})
        AND (${search}::text IS NULL
             OR ea.first_name  ILIKE ${search}
             OR ea.last_name   ILIKE ${search}
             OR ea.parent_name ILIKE ${search}
             OR ea.parent_phone ILIKE ${search})
    `,
  ])

  const total = (countRows as any[])[0]?.total ?? 0
  return {
    data: rows as any[],
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  }
}

// ─── Statistiques candidatures ────────────────────────────────────────────────
export async function getEnrollmentStats() {
  const session = await requireRole('ADMIN', 'CENSOR')
  const db      = getTenantPrisma(session.user.schemaName) as any

  const rows = await db.$queryRaw`
    SELECT status, COUNT(*)::int AS count
    FROM enrollment_applications
    GROUP BY status
  ` as any[]

  const map: Record<string, number> = {}
  for (const r of rows) map[r.status] = r.count
  return {
    pending:    map['PENDING']    ?? 0,
    accepted:   map['ACCEPTED']   ?? 0,
    rejected:   map['REJECTED']   ?? 0,
    waitlisted: map['WAITLISTED'] ?? 0,
    total: rows.reduce((a, r) => a + r.count, 0),
  }
}

// ─── Décision sur une candidature ─────────────────────────────────────────────
export async function reviewApplication(
  applicationId: string,
  decision: 'ACCEPTED' | 'REJECTED' | 'WAITLISTED',
  reviewNotes?: string
): Promise<ActionResult> {
  const session = await requireRole('ADMIN')
  const db      = getTenantPrisma(session.user.schemaName) as any

  try {
    const [app] = await db.$queryRaw`
      UPDATE enrollment_applications
      SET status       = ${decision},
          reviewed_by  = ${session.user.id},
          reviewed_at  = NOW(),
          review_notes = ${reviewNotes ?? null}
      WHERE id = ${applicationId}
      RETURNING first_name, last_name, parent_email, parent_phone, parent_name
    ` as any[]

    // Notifier le parent par SMS/email
    if (app && app.parent_email && decision !== 'WAITLISTED') {
      const isAccepted = decision === 'ACCEPTED'
      await sendNotification({
        userId: applicationId, // pas d'userId réel pour les candidats
        type:   'ANNOUNCEMENT',
        title:  isAccepted ? 'Candidature acceptée !' : 'Candidature non retenue',
        body:   isAccepted
          ? `La candidature de ${app.first_name} ${app.last_name} a été acceptée. Bienvenue !`
          : `La candidature de ${app.first_name} ${app.last_name} n'a pas été retenue cette année.`,
        channels: ['email'],
        email: {
          to:      app.parent_email,
          subject: isAccepted ? 'Votre candidature a été acceptée' : 'Résultat de votre candidature',
          html: isAccepted
            ? `<p>Bonjour ${app.parent_name},</p>
               <p>Nous avons le plaisir de vous informer que la candidature de <strong>${app.first_name} ${app.last_name}</strong> a été <strong>acceptée</strong>.</p>
               <p>Vous serez contacté(e) prochainement pour les formalités d'inscription.</p>`
            : `<p>Bonjour ${app.parent_name},</p>
               <p>Nous avons bien reçu la candidature de <strong>${app.first_name} ${app.last_name}</strong>. Malheureusement, celle-ci n'a pas pu être retenue cette année.</p>`,
        },
      }).catch(() => {}) // Email non bloquant
    }

    revalidatePath('/admin/enrollments')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Envoi SMS de rappel (paiements en attente) ───────────────────────────────
export async function sendPaymentReminderSMS(
  parentPhone: string,
  studentName: string,
  amount:      string,
  dueDate:     string
): Promise<ActionResult> {
  await requireRole('ADMIN', 'ACCOUNTANT')
  try {
    await sendNotification({
      userId:   'system',
      type:     'PAYMENT_DUE',
      title:    'Rappel de paiement',
      body:     `Rappel paiement ${amount} pour ${studentName}`,
      channels: ['sms'],
      sms: {
        to:      parentPhone,
        message: `ClasseLink: Rappel - Un paiement de ${amount} est attendu avant le ${dueDate} pour ${studentName}. Merci de régulariser.`,
      },
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}
