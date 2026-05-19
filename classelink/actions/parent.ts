'use server'

import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import { initiatePayment } from '@/lib/payments/cinetpay'

async function getParentDb() {
  const session = await requireRole('PARENT')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, session }
}

export async function getParentChildren() {
  const { db, session } = await getParentDb()
  return db.$queryRaw`
    SELECT s.id, s.student_id AS student_number,
           u.first_name, u.last_name, u.email, u.avatar_url,
           ps.relation,
           c.name AS class_name, l.name AS level_name,
           ay.name AS year_name
    FROM parent_students ps
    JOIN parents p ON p.id = ps.parent_id
    JOIN students s ON s.id = ps.student_id
    JOIN users u ON u.id = s.user_id
    LEFT JOIN enrollments e  ON e.student_id = s.id AND e.status = 'ACTIVE'
    LEFT JOIN classes c      ON c.id = e.class_id
    LEFT JOIN levels l       ON l.id = c.level_id
    LEFT JOIN academic_years ay ON ay.is_current = TRUE
    WHERE p.user_id = ${session.user.id}
    ORDER BY u.last_name, u.first_name
  ` as Promise<any[]>
}

export async function getChildDetails(studentId: string) {
  const { db, session } = await getParentDb()

  // Vérifier que l'élève appartient bien à ce parent
  const check: any[] = await db.$queryRaw`
    SELECT ps.id FROM parent_students ps
    JOIN parents p ON p.id = ps.parent_id
    WHERE p.user_id = ${session.user.id} AND ps.student_id = ${studentId}
    LIMIT 1
  `
  if (!check[0]) return null

  const [profile, terms, payments, attendance] = await Promise.all([
    db.$queryRaw`
      SELECT s.id, s.student_id AS student_number, s.date_of_birth, s.gender,
             u.first_name, u.last_name, u.email, u.phone, u.avatar_url,
             c.id AS class_id, c.name AS class_name, l.name AS level_name,
             ay.name AS year_name
      FROM students s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN enrollments e  ON e.student_id = s.id AND e.status = 'ACTIVE'
      LEFT JOIN classes c      ON c.id = e.class_id
      LEFT JOIN levels l       ON l.id = c.level_id
      LEFT JOIN academic_years ay ON ay.is_current = TRUE
      WHERE s.id = ${studentId} LIMIT 1
    ` as Promise<any[]>,

    db.$queryRaw`
      SELECT t.id, t.name, t.term_order FROM terms t
      JOIN academic_years ay ON ay.id = t.academic_year_id AND ay.is_current = TRUE
      ORDER BY t.term_order
    ` as Promise<any[]>,

    db.$queryRaw`
      SELECT p.id, p.amount, p.status, p.paid_at, p.due_date, ft.name AS fee_name
      FROM payments p
      JOIN fee_types ft ON ft.id = p.fee_type_id
      WHERE p.student_id = ${studentId}
      ORDER BY p.created_at DESC LIMIT 20
    ` as Promise<any[]>,

    db.$queryRaw`
      SELECT t.name AS term_name, t.term_order,
             COUNT(a.id)::int AS total,
             COUNT(CASE WHEN a.status='ABSENT' THEN 1 END)::int AS absent,
             COUNT(CASE WHEN a.status='LATE'   THEN 1 END)::int AS late,
             COUNT(CASE WHEN a.status='ABSENT' AND a.justified=FALSE THEN 1 END)::int AS unjustified
      FROM terms t
      JOIN academic_years ay ON ay.id = t.academic_year_id AND ay.is_current = TRUE
      LEFT JOIN attendances a ON a.term_id = t.id AND a.student_id = ${studentId}
      GROUP BY t.id, t.name, t.term_order
      ORDER BY t.term_order
    ` as Promise<any[]>,
  ])

  // Moyennes générales par trimestre
  const averages: any[] = await db.$queryRaw`
    SELECT g.term_id, t.name AS term_name, t.term_order,
           ROUND(
             SUM(
               (SUM(g.value * g.coefficient) / NULLIF(SUM(g.coefficient), 0))
               * COALESCE(ls.coefficient, 1)
             ) OVER (PARTITION BY g.term_id)
             /
             NULLIF(SUM(COALESCE(ls.coefficient, 1)) OVER (PARTITION BY g.term_id), 0),
             2
           ) AS general_average
    FROM grades g
    JOIN terms t ON t.id = g.term_id
    JOIN academic_years ay ON ay.id = t.academic_year_id AND ay.is_current = TRUE
    JOIN subjects s ON s.id = g.subject_id
    LEFT JOIN enrollments e ON e.student_id = ${studentId} AND e.status = 'ACTIVE'
    LEFT JOIN level_subjects ls ON ls.subject_id = g.subject_id AND ls.level_id = (
      SELECT c.level_id FROM classes c WHERE c.id = e.class_id LIMIT 1
    )
    WHERE g.student_id = ${studentId}
    GROUP BY g.term_id, g.subject_id, t.name, t.term_order, ls.coefficient
  `

  // Déduplique les moyennes par trimestre (prend la première valeur par term_id)
  const avgByTerm: Record<string, number | null> = {}
  for (const a of averages) {
    if (!avgByTerm[a.term_id]) {
      avgByTerm[a.term_id] = a.general_average ? parseFloat(a.general_average) : null
    }
  }

  return {
    profile: profile[0],
    terms: terms.map((t: any) => ({ ...t, average: avgByTerm[t.id] ?? null })),
    payments,
    attendance,
  }
}

export async function getChildAbsencesForJustification(studentId: string) {
  const { db, session } = await getParentDb()

  // Vérifier que l'élève appartient au parent
  const check: any[] = await db.$queryRaw`
    SELECT ps.id FROM parent_students ps
    JOIN parents p ON p.id = ps.parent_id
    WHERE p.user_id = ${session.user.id} AND ps.student_id = ${studentId}
    LIMIT 1
  `
  if (!check[0]) return []

  return db.$queryRaw`
    SELECT a.id, a.date, a.justification
    FROM attendances a
    WHERE a.student_id = ${studentId}
      AND a.status = 'ABSENT'
      AND a.justified = FALSE
    ORDER BY a.date DESC
  ` as Promise<any[]>
}

export async function submitJustification(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { db, session } = await getParentDb()

    const attendanceId  = formData.get('attendance_id') as string
    const justification = formData.get('justification') as string

    if (!attendanceId || !justification) {
      return { success: false, error: 'Identifiant de présence et justification requis.' }
    }

    // Récupérer l'attendance pour vérifier la parenté
    const attendance: any[] = await db.$queryRaw`
      SELECT a.student_id FROM attendances a WHERE a.id = ${attendanceId} LIMIT 1
    `
    if (!attendance[0]) return { success: false, error: 'Absence introuvable.' }

    const studentId = attendance[0].student_id

    // Vérifier que l'élève appartient au parent
    const check: any[] = await db.$queryRaw`
      SELECT ps.id FROM parent_students ps
      JOIN parents p ON p.id = ps.parent_id
      WHERE p.user_id = ${session.user.id} AND ps.student_id = ${studentId}
      LIMIT 1
    `
    if (!check[0]) return { success: false, error: 'Accès non autorisé.' }

    await db.$executeRaw`
      UPDATE attendances
      SET justified = TRUE, justification = ${justification}
      WHERE id = ${attendanceId}
    `
    revalidatePath('/parent/absences')
    return { success: true, data: undefined }
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Erreur' }
  }
}

// ─── Helper : vérifier que l'élève appartient au parent ──────────────────────
async function assertOwnership(db: any, userId: string, studentId: string) {
  const check: any[] = await db.$queryRaw`
    SELECT ps.id FROM parent_students ps
    JOIN parents p ON p.id = ps.parent_id
    WHERE p.user_id = ${userId} AND ps.student_id = ${studentId}
    LIMIT 1
  `
  return !!check[0]
}

// ─── Notes par matière et par trimestre ──────────────────────────────────────
export async function getChildGrades(studentId: string) {
  const { db, session } = await getParentDb()
  if (!(await assertOwnership(db, session.user.id, studentId))) return null

  const [terms, rows] = await Promise.all([
    db.$queryRaw`
      SELECT t.id, t.name, t.term_order
      FROM terms t
      JOIN academic_years ay ON ay.id = t.academic_year_id AND ay.is_current = TRUE
      ORDER BY t.term_order
    ` as Promise<any[]>,

    db.$queryRaw`
      SELECT
        g.term_id,
        sub.id   AS subject_id,
        sub.name AS subject_name,
        COALESCE(ls.coefficient, 1)::float        AS coefficient,
        ROUND(SUM(g.value * g.coefficient)::numeric
              / NULLIF(SUM(g.coefficient), 0), 2)  AS subject_avg,
        COUNT(g.id)::int                           AS grade_count,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', g.id, 'value', g.value,
            'coefficient', g.coefficient,
            'type', g.type,
            'comment', g.comment,
            'published_at', g.published_at
          ) ORDER BY g.published_at DESC NULLS LAST
        ) AS grades
      FROM grades g
      JOIN subjects sub ON sub.id = g.subject_id
      JOIN terms t ON t.id = g.term_id
      JOIN academic_years ay ON ay.id = t.academic_year_id AND ay.is_current = TRUE
      LEFT JOIN enrollments e ON e.student_id = ${studentId} AND e.status = 'ACTIVE'
      LEFT JOIN level_subjects ls
        ON ls.subject_id = g.subject_id
        AND ls.level_id = (
          SELECT c.level_id FROM classes c WHERE c.id = e.class_id LIMIT 1
        )
      WHERE g.student_id = ${studentId}
      GROUP BY g.term_id, sub.id, sub.name, ls.coefficient
      ORDER BY sub.name
    ` as Promise<any[]>,
  ])

  return { terms: terms as any[], rows: rows as any[] }
}

// ─── Devoirs et exercices ─────────────────────────────────────────────────────
export async function getChildAssignments(studentId: string) {
  const { db, session } = await getParentDb()
  if (!(await assertOwnership(db, session.user.id, studentId))) return null

  return db.$queryRaw`
    SELECT
      a.id, a.title, a.description, a.due_date, a.max_score,
      sub.name AS subject_name,
      sm.id          AS submission_id,
      sm.submitted_at,
      sm.score,
      sm.feedback,
      sm.status      AS submission_status
    FROM assignments a
    JOIN subjects sub ON sub.id = a.subject_id
    LEFT JOIN submissions sm
      ON sm.assignment_id = a.id AND sm.student_id = ${studentId}
    WHERE a.class_id = (
      SELECT e.class_id FROM enrollments e
      WHERE e.student_id = ${studentId} AND e.status = 'ACTIVE'
      LIMIT 1
    )
    ORDER BY a.due_date DESC NULLS LAST
    LIMIT 60
  ` as Promise<any[]>
}

// ─── Emploi du temps ──────────────────────────────────────────────────────────
export async function getChildSchedule(studentId: string) {
  const { db, session } = await getParentDb()
  if (!(await assertOwnership(db, session.user.id, studentId))) return null

  return db.$queryRaw`
    SELECT
      sc.id, sc.day_of_week, sc.start_time, sc.end_time, sc.room,
      sub.name AS subject_name,
      u.first_name || ' ' || u.last_name AS teacher_name
    FROM schedules sc
    JOIN teacher_subject_classes tsc ON tsc.id = sc.teacher_subject_class_id
    JOIN subjects sub ON sub.id = tsc.subject_id
    JOIN teachers te ON te.id = tsc.teacher_id
    JOIN users u ON u.id = te.user_id
    WHERE sc.class_id = (
      SELECT e.class_id FROM enrollments e
      WHERE e.student_id = ${studentId} AND e.status = 'ACTIVE'
      LIMIT 1
    )
    ORDER BY sc.day_of_week, sc.start_time
  ` as Promise<any[]>
}

export async function initiateOnlinePayment(
  paymentId: string,
  studentId: string
): Promise<ActionResult<{ paymentUrl: string }>> {
  try {
    const { db, session } = await getParentDb()

    // Vérifier que l'élève appartient bien à ce parent
    const check: any[] = await db.$queryRaw`
      SELECT ps.id FROM parent_students ps
      JOIN parents p ON p.id = ps.parent_id
      WHERE p.user_id = ${session.user.id} AND ps.student_id = ${studentId}
      LIMIT 1
    `
    if (!check[0]) return { success: false, error: 'Accès non autorisé.' }

    // Récupérer le paiement
    const rows: any[] = await db.$queryRaw`
      SELECT p.id, p.amount, p.status, p.provider_ref,
             ft.name AS fee_name, p.student_id
      FROM payments p
      JOIN fee_types ft ON ft.id = p.fee_type_id
      WHERE p.id = ${paymentId} AND p.student_id = ${studentId}
      LIMIT 1
    `
    const payment = rows[0]
    if (!payment) return { success: false, error: 'Paiement introuvable.' }
    if (payment.status !== 'PENDING') return { success: false, error: 'Ce paiement n\'est pas en attente.' }
    if (payment.provider_ref) return { success: false, error: 'Une transaction est déjà en cours pour ce paiement.' }

    // Récupérer le profil de l'utilisateur parent
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const schemaName = session.user.schemaName

    const init = await initiatePayment({
      amount: Number(payment.amount),
      description: payment.fee_name,
      customerId: session.user.id,
      customerName: session.user.name ?? session.user.email ?? '',
      customerEmail: session.user.email ?? '',
      returnUrl: `${baseUrl}/parent/payment/return?paymentId=${paymentId}&studentId=${studentId}`,
      notifyUrl: `${baseUrl}/api/webhooks/cinetpay`,
      metadata: { paymentId, schemaName, studentId },
    })

    // Stocker le transactionId comme provider_ref
    await db.$executeRaw`
      UPDATE payments
      SET provider = 'CINETPAY', provider_ref = ${init.transactionId}
      WHERE id = ${paymentId}
    `

    return { success: true, data: { paymentUrl: init.paymentUrl } }
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Erreur lors de l\'initiation du paiement.' }
  }
}