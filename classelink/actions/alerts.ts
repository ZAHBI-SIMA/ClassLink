'use server'

import { getTenantPrisma } from '@/lib/db/tenant'
import { requireRole } from '@/lib/auth/rbac'
import { revalidatePath } from 'next/cache'
import { toActionError } from '@/lib/errors'
import type { ActionResult } from '@/types'

async function getAdminDb() {
  const session = await requireRole('ADMIN', 'CENSOR')
  const db = getTenantPrisma(session.user.schemaName) as any
  return { db, user: session.user }
}

// ─── Liste des règles d'alerte ────────────────────────────────────────────────
export async function getAlertRules(): Promise<any[]> {
  const { db } = await getAdminDb()

  const rows: any[] = await db.$queryRaw`
    SELECT id, type, threshold, notify_sms, notify_email, is_active, created_at
    FROM alert_rules
    ORDER BY type
  `
  return rows
}

// ─── Sauvegarder une règle (UPSERT) ──────────────────────────────────────────
export async function saveAlertRule(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { db } = await getAdminDb()

  const type         = formData.get('type')         as string
  const threshold    = parseInt(formData.get('threshold') as string ?? '0', 10)
  const notifySms    = formData.get('notify_sms')   === 'on'
  const notifyEmail  = formData.get('notify_email') === 'on'
  const isActive     = formData.get('is_active')    === 'on'

  if (!type) {
    return { success: false, error: 'Type de règle requis.' }
  }

  try {
    await db.$executeRaw`
      INSERT INTO alert_rules (type, threshold, notify_sms, notify_email, is_active)
      VALUES (${type}, ${threshold}, ${notifySms}, ${notifyEmail}, ${isActive})
      ON CONFLICT (type) DO UPDATE
        SET threshold    = EXCLUDED.threshold,
            notify_sms   = EXCLUDED.notify_sms,
            notify_email = EXCLUDED.notify_email,
            is_active    = EXCLUDED.is_active
    `
    revalidatePath('/admin/alerts')
    return { success: true }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}

// ─── Logs d'alertes récents ───────────────────────────────────────────────────
export async function getAlertLogs(limit = 50): Promise<any[]> {
  const { db } = await getAdminDb()

  const rows: any[] = await db.$queryRaw`
    SELECT
      al.id, ar.type AS rule_type, al.message, al.triggered_at,
      u.first_name || ' ' || u.last_name AS student_name
    FROM alert_logs al
    JOIN alert_rules ar   ON ar.id = al.rule_id
    LEFT JOIN students s  ON s.id  = al.student_id
    LEFT JOIN users u     ON u.id  = s.user_id
    ORDER BY al.triggered_at DESC
    LIMIT ${limit}
  `
  return rows
}

// ─── Vérification manuelle des alertes ───────────────────────────────────────
export async function runAlertCheck(): Promise<ActionResult<{ triggered: number }>> {
  const { db, user } = await getAdminDb()

  let triggered = 0

  try {
    // Récupérer les règles actives
    const rules: any[] = await db.$queryRaw`
      SELECT id, type, threshold, notify_sms, notify_email
      FROM alert_rules
      WHERE is_active = true
    `

    for (const rule of rules) {
      if (rule.type === 'ABSENCE_THRESHOLD') {
        // Élèves dépassant le seuil d'absences non justifiées ce trimestre
        const students: any[] = await db.$queryRaw`
          SELECT
            s.id AS student_id,
            u.first_name || ' ' || u.last_name AS student_name,
            COUNT(a.id)::int AS absence_count
          FROM students s
          JOIN users u ON u.id = s.user_id
          JOIN attendances a ON a.student_id = s.id
          WHERE a.status = 'ABSENT'
            AND a.justified = false
            AND a.date >= DATE_TRUNC('quarter', CURRENT_DATE)
          GROUP BY s.id, student_name
          HAVING COUNT(a.id) >= ${rule.threshold}
        `
        for (const student of students) {
          // Vérifier si log déjà créé aujourd'hui pour éviter duplicats
          const existing: any[] = await db.$queryRaw`
            SELECT id FROM alert_logs
            WHERE student_id = ${student.student_id}
              AND rule_id = ${rule.id}
              AND triggered_at::date = CURRENT_DATE
            LIMIT 1
          `
          if (!existing[0]) {
            await db.$executeRaw`
              INSERT INTO alert_logs (student_id, rule_id, message)
              VALUES (
                ${student.student_id},
                ${rule.id},
                ${`${student.student_name} — ${student.absence_count} absences non justifiées ce trimestre (seuil: ${rule.threshold})`}
              )
            `
            triggered++
          }
        }
      }

      if (rule.type === 'PAYMENT_OVERDUE') {
        // Paiements en retard de X jours
        const payments: any[] = await db.$queryRaw`
          SELECT
            p.id AS payment_id,
            s.id AS student_id,
            u.first_name || ' ' || u.last_name AS student_name,
            p.amount, p.due_date,
            (CURRENT_DATE - p.due_date::date)::int AS days_overdue
          FROM payments p
          JOIN students s ON s.id = p.student_id
          JOIN users u    ON u.id = s.user_id
          WHERE p.status = 'PENDING'
            AND p.due_date < NOW() - (${rule.threshold} || ' days')::interval
        `
        for (const payment of payments) {
          const existing: any[] = await db.$queryRaw`
            SELECT id FROM alert_logs
            WHERE student_id = ${payment.student_id}
              AND rule_id = ${rule.id}
              AND triggered_at::date = CURRENT_DATE
            LIMIT 1
          `
          if (!existing[0]) {
            await db.$executeRaw`
              INSERT INTO alert_logs (student_id, rule_id, message)
              VALUES (
                ${payment.student_id},
                ${rule.id},
                ${`${payment.student_name} — paiement en retard de ${payment.days_overdue} jours (montant: ${payment.amount})`}
              )
            `
            triggered++
          }
        }
      }

      if (rule.type === 'GRADE_DROP') {
        // Chute de moyenne entre trimestres
        const drops: any[] = await db.$queryRaw`
          SELECT
            s.id AS student_id,
            u.first_name || ' ' || u.last_name AS student_name,
            t1.average AS avg_t1, t2.average AS avg_t2,
            (t1.average - t2.average) AS drop_points
          FROM students s
          JOIN users u ON u.id = s.user_id
          JOIN LATERAL (
            SELECT AVG(g.value)::numeric(5,2) AS average
            FROM grades g
            JOIN terms t ON t.id = g.term_id
            WHERE g.student_id = s.id AND t.term_order = 1
          ) t1 ON true
          JOIN LATERAL (
            SELECT AVG(g.value)::numeric(5,2) AS average
            FROM grades g
            JOIN terms t ON t.id = g.term_id
            WHERE g.student_id = s.id AND t.term_order = 2
          ) t2 ON true
          WHERE (t1.average - t2.average) >= ${rule.threshold}
        `
        for (const drop of drops) {
          const existing: any[] = await db.$queryRaw`
            SELECT id FROM alert_logs
            WHERE student_id = ${drop.student_id}
              AND rule_id = ${rule.id}
              AND triggered_at::date = CURRENT_DATE
            LIMIT 1
          `
          if (!existing[0]) {
            await db.$executeRaw`
              INSERT INTO alert_logs (student_id, rule_id, message)
              VALUES (
                ${drop.student_id},
                ${rule.id},
                ${`${drop.student_name} — chute de ${drop.drop_points} points (T1: ${drop.avg_t1} → T2: ${drop.avg_t2})`}
              )
            `
            triggered++
          }
        }
      }

      if (rule.type === 'LATE_THRESHOLD') {
        // Élèves dépassant le seuil de retards ce trimestre
        const students: any[] = await db.$queryRaw`
          SELECT
            s.id AS student_id,
            u.first_name || ' ' || u.last_name AS student_name,
            COUNT(a.id)::int AS late_count
          FROM students s
          JOIN users u ON u.id = s.user_id
          JOIN attendances a ON a.student_id = s.id
          WHERE a.status = 'LATE'
            AND a.date >= DATE_TRUNC('quarter', CURRENT_DATE)
          GROUP BY s.id, student_name
          HAVING COUNT(a.id) >= ${rule.threshold}
        `
        for (const student of students) {
          const existing: any[] = await db.$queryRaw`
            SELECT id FROM alert_logs
            WHERE student_id = ${student.student_id}
              AND rule_id = ${rule.id}
              AND triggered_at::date = CURRENT_DATE
            LIMIT 1
          `
          if (!existing[0]) {
            await db.$executeRaw`
              INSERT INTO alert_logs (student_id, rule_id, message)
              VALUES (
                ${student.student_id},
                ${rule.id},
                ${`${student.student_name} — ${student.late_count} retards ce trimestre (seuil: ${rule.threshold})`}
              )
            `
            triggered++
          }
        }
      }
    }

    revalidatePath('/admin/alerts')
    return { success: true, data: { triggered } }
  } catch (error) {
    return { success: false, error: toActionError(error) }
  }
}
